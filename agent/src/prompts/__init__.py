from pathlib import Path

PROMPT_DIR = Path(__file__).parent


def load_prompt(filename: str) -> str:
    """Load a prompt from the prompts/ directory."""
    prompt_path = PROMPT_DIR / filename
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    return prompt_path.read_text(encoding="utf-8")


FORMATTER_PROMPT = load_prompt("formatter.md")
RANKING_PROMPT = load_prompt("ranking.md")
AUDITOR_PROMPT = load_prompt("auditor.md")
FRAUD_DETECTOR_PROMPT = load_prompt("fraud_detector.md")
CHATBOT_PROMPT = load_prompt("chatbot.md")
TITLE_PROMPT = load_prompt("title.md")
