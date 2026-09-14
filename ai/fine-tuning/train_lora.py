#!/usr/bin/env python3
"""
StyleMate LoRA / SFT Training Pipeline
======================================
Fine-tunes an open-source LLM (Qwen2.5-1.5B-Instruct or Llama-3.2-1B-Instruct)
on StyleMate's NLU intent parsing dataset using Hugging Face PEFT (LoRA) and TRL.

Features:
- Parameter-Efficient Fine-Tuning (LoRA: r=8, alpha=16, dropout=0.05)
- Targets attention projection modules: q_proj, v_proj, k_proj, o_proj
- Auto-detects compute device: Apple Silicon (MPS), NVIDIA GPU (CUDA), or CPU fallback
- Native chat template formatting with tokenizer
- Saves adapter weights and tokenizer for local inference serving
- Dry-run validation mode for rapid schema & pipeline verification

Usage:
    python3 ai/fine-tuning/train_lora.py \
        --model_name "Qwen/Qwen2.5-1.5B-Instruct" \
        --data_path "stylemate-backend/data/train_nlu.jsonl" \
        --output_dir "ai/fine-tuning/stylemate-lora-adapter" \
        --epochs 3 --batch_size 4 --lr 2e-4
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("StyleMate-TrainLoRA")


def parse_args():
    # Resolve default paths relative to script location
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent

    default_data_path = repo_root / "stylemate-backend" / "data" / "train_nlu.jsonl"
    default_output_dir = script_dir / "stylemate-lora-adapter"

    parser = argparse.ArgumentParser(
        description="Fine-tune an open-source LLM for StyleMate NLU with LoRA."
    )
    parser.add_argument(
        "--model_name",
        type=str,
        default="Qwen/Qwen2.5-1.5B-Instruct",
        help="Base model ID on Hugging Face Hub (default: Qwen/Qwen2.5-1.5B-Instruct; alternative: meta-llama/Llama-3.2-1B-Instruct)",
    )
    parser.add_argument(
        "--data_path",
        type=str,
        default=str(default_data_path),
        help=f"Path to train_nlu.jsonl dataset (default: {default_data_path})",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default=str(default_output_dir),
        help=f"Directory to save trained LoRA adapter weights (default: {default_output_dir})",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=3,
        help="Number of training epochs (default: 3)",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=4,
        help="Per-device training batch size (default: 4)",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=2e-4,
        help="Learning rate for AdamW optimizer (default: 2e-4)",
    )
    parser.add_argument(
        "--lora_r",
        type=int,
        default=8,
        help="LoRA rank dimension (default: 8)",
    )
    parser.add_argument(
        "--lora_alpha",
        type=int,
        default=16,
        help="LoRA alpha scaling factor (default: 16)",
    )
    parser.add_argument(
        "--lora_dropout",
        type=float,
        default=0.05,
        help="LoRA dropout rate (default: 0.05)",
    )
    parser.add_argument(
        "--max_seq_length",
        type=int,
        default=512,
        help="Maximum token sequence length (default: 512)",
    )
    parser.add_argument(
        "--grad_accum",
        type=int,
        default=2,
        help="Gradient accumulation steps (default: 2)",
    )
    parser.add_argument(
        "--dry_run",
        action="store_true",
        help="Verify dataset parsing, schema, and device config without downloading weights",
    )
    return parser.parse_args()


def detect_device():
    """Detect available compute device: CUDA, MPS, or CPU."""
    try:
        import torch

        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            logger.info(f"Using NVIDIA CUDA GPU: {device_name}")
            return "cuda", torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            logger.info("Using Apple Silicon GPU (MPS)")
            return "mps", torch.float16
        else:
            logger.info("Using CPU fallback for training")
            return "cpu", torch.float32
    except ImportError:
        logger.warning("PyTorch not installed. Device detection defaulted to CPU.")
        return "cpu", None


def load_stylemate_dataset(data_path):
    """
    Loads and validates the StyleMate JSONL dataset.
    Each row is expected to have 'messages': [{'role': ..., 'content': ...}, ...].
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training dataset not found at: {data_path}")

    records = []
    with open(data_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                if "messages" not in row or not isinstance(row["messages"], list):
                    logger.warning(f"Line {idx} missing 'messages' list, skipping.")
                    continue
                records.append(row)
            except json.JSONDecodeError as err:
                logger.warning(f"Line {idx} invalid JSON ({err}), skipping.")

    logger.info(f"Successfully loaded {len(records)} training samples from {data_path}")
    return records


def format_chat_prompt(tokenizer, messages):
    """
    Applies the tokenizer's chat template or uses standard ChatML formatting.
    """
    if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template:
        try:
            return tokenizer.apply_chat_template(messages, tokenize=False)
        except Exception:
            pass

    # Standard fallback ChatML formatting
    formatted = ""
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        formatted += f"<|im_start|>{role}\n{content}<|im_end|>\n"
    return formatted


def train_lora(args):
    """Main training orchestration."""
    start_time = time.time()
    logger.info("=" * 65)
    logger.info(" StyleMate Open-Source Model LoRA Fine-Tuning Pipeline ")
    logger.info("=" * 65)
    logger.info(f"Model ID:        {args.model_name}")
    logger.info(f"Dataset Path:    {args.data_path}")
    logger.info(f"Output Dir:      {args.output_dir}")
    logger.info(f"Epochs:          {args.epochs}")
    logger.info(f"Batch Size:      {args.batch_size} (grad_accum={args.grad_accum})")
    logger.info(f"Learning Rate:   {args.lr}")
    logger.info(f"LoRA Config:     r={args.lora_r}, alpha={args.lora_alpha}, dropout={args.lora_dropout}")
    logger.info(f"Target Modules:  ['q_proj', 'v_proj', 'k_proj', 'o_proj']")
    logger.info("=" * 65)

    # 1. Load and inspect dataset
    records = load_stylemate_dataset(args.data_path)
    if len(records) == 0:
        logger.error("No valid training examples found. Aborting.")
        sys.exit(1)

    # 2. Check dependencies
    try:
        import torch
        import transformers
        import peft
        from peft import LoraConfig, TaskType, get_peft_model
        import datasets
        from datasets import Dataset
    except ImportError as e:
        logger.error(
            f"Missing required ML dependency: {e.name}\n"
            "To install training dependencies, run:\n"
            "    pip install torch transformers peft trl datasets accelerate\n"
        )
        if args.dry_run:
            logger.info("Dry run succeeded: dataset is valid and training args are configured.")
            return
        sys.exit(1)

    device_type, torch_dtype = detect_device()

    if args.dry_run:
        logger.info(f"Dry run complete: {len(records)} samples verified. Device: {device_type}. Ready for training.")
        return

    # 3. Load Tokenizer
    logger.info(f"Loading tokenizer: {args.model_name}...")
    tokenizer = transformers.AutoTokenizer.from_pretrained(
        args.model_name,
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 4. Format Dataset
    formatted_data = []
    for rec in records:
        text = format_chat_prompt(tokenizer, rec["messages"])
        formatted_data.append({"text": text})

    train_dataset = Dataset.from_list(formatted_data)
    logger.info(f"Prepared Hugging Face Dataset with {len(train_dataset)} examples.")

    # 5. Load Base Model
    logger.info(f"Loading base causal LM: {args.model_name} (dtype: {torch_dtype})...")
    model_kwargs = {
        "trust_remote_code": True,
        "torch_dtype": torch_dtype if torch_dtype else torch.float32,
    }

    if device_type == "cuda":
        model_kwargs["device_map"] = "auto"

    model = transformers.AutoModelForCausalLM.from_pretrained(
        args.model_name,
        **model_kwargs,
    )

    if device_type == "mps":
        model = model.to("mps")
    elif device_type == "cpu":
        model = model.to("cpu")

    # 6. Apply LoRA Configuration
    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        task_type=TaskType.CAUSAL_LM,
        bias="none",
    )

    model = get_peft_model(model, lora_config)
    trainable_params, all_param = model.get_nb_trainable_parameters()
    logger.info(
        f"Trainable params: {trainable_params:,} / {all_param:,} "
        f"({100 * trainable_params / all_param:.2f}% of model)"
    )

    # 7. Configure SFTTrainer / TrainingArguments
    os.makedirs(args.output_dir, exist_ok=True)

    # Import SFTTrainer and SFTConfig from TRL
    try:
        from trl import SFTTrainer, SFTConfig
        training_args = SFTConfig(
            output_dir=args.output_dir,
            num_train_epochs=args.epochs,
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=args.grad_accum,
            learning_rate=args.lr,
            logging_steps=5,
            save_strategy="epoch",
            save_total_limit=2,
            fp16=(device_type == "cuda" and torch_dtype == torch.float16),
            bf16=(device_type == "cuda" and torch_dtype == torch.bfloat16),
            max_seq_length=args.max_seq_length,
            dataset_text_field="text",
            report_to="none",
            optim="adamw_torch",
            warmup_ratio=0.05,
        )
        trainer = SFTTrainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            tokenizer=tokenizer,
            peft_config=lora_config,
        )
    except (ImportError, TypeError):
        # Fallback to standard Hugging Face TrainingArguments + Trainer
        from transformers import TrainingArguments, Trainer, DataCollatorForLanguageModeling

        def tokenize_func(examples):
            return tokenizer(
                examples["text"],
                truncation=True,
                max_length=args.max_seq_length,
                padding="max_length",
            )

        tokenized_dataset = train_dataset.map(tokenize_func, batched=True)

        training_args = TrainingArguments(
            output_dir=args.output_dir,
            num_train_epochs=args.epochs,
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=args.grad_accum,
            learning_rate=args.lr,
            logging_steps=5,
            save_strategy="epoch",
            save_total_limit=2,
            fp16=(device_type == "cuda" and torch_dtype == torch.float16),
            report_to="none",
            optim="adamw_torch",
            warmup_ratio=0.05,
        )
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
        )

    # 8. Run Training
    logger.info("Starting LoRA fine-tuning run...")
    train_result = trainer.train()

    # 9. Save Adapter & Tokenizer
    logger.info(f"Training complete! Saving LoRA adapter to: {args.output_dir}")
    trainer.model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    # 10. Write training summary metadata
    duration = time.time() - start_time
    summary_path = Path(args.output_dir) / "training_summary.json"
    summary = {
        "base_model": args.model_name,
        "dataset_samples": len(records),
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.lr,
        "lora_r": args.lora_r,
        "lora_alpha": args.lora_alpha,
        "target_modules": ["q_proj", "v_proj", "k_proj", "o_proj"],
        "device": device_type,
        "duration_seconds": round(duration, 2),
        "train_loss": getattr(train_result, "training_loss", None),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    logger.info(f"Saved metadata summary to {summary_path}")
    logger.info(f"All done in {duration:.1f}s. Adapter ready for StyleMate local server inference.")


if __name__ == "__main__":
    cli_args = parse_args()
    train_lora(cli_args)
