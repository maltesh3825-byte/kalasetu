from backend.config import GEMINI_MODEL


def test_default_gemini_model_is_supported():
    supported_models = {"gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"}
    assert GEMINI_MODEL in supported_models, f"Unexpected default model: {GEMINI_MODEL}"
