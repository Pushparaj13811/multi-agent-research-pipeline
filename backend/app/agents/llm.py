from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI


class MissingAPIKeyError(Exception):
    """Raised when no API key is available for the requested provider."""
    pass


def get_llm(provider: str, api_keys: dict | None = None):
    """Get LLM instance based on provider name. Requires user-provided keys — no server fallback."""
    keys = api_keys or {}

    if provider == "anthropic":
        key = keys.get("anthropic_api_key")
        if not key:
            raise MissingAPIKeyError("No Anthropic API key configured. Add one in Settings.")
        return ChatAnthropic(model="claude-sonnet-4-20250514", api_key=key)

    if provider == "bedrock":
        from langchain_aws import ChatBedrockConverse
        bedrock_api_key = keys.get("bedrock_api_key")
        model_id = keys.get("bedrock_model_id", "anthropic.claude-3-sonnet-20240229-v1:0")
        region = keys.get("aws_region", "us-east-1")

        if bedrock_api_key:
            return ChatBedrockConverse(
                model=model_id,
                region_name=region,
                provider="anthropic",
            )

        # AWS credentials path
        aws_key = keys.get("aws_access_key_id")
        aws_secret = keys.get("aws_secret_access_key")
        if not aws_key or not aws_secret:
            raise MissingAPIKeyError("No Bedrock API key or AWS credentials configured. Add one in Settings.")
        return ChatBedrockConverse(
            model=model_id,
            region_name=region,
            credentials_profile_name=None,
            aws_access_key_id=aws_key,
            aws_secret_access_key=aws_secret,
        )

    # openai
    key = keys.get("openai_api_key")
    if not key:
        raise MissingAPIKeyError("No OpenAI API key configured. Add one in Settings.")
    return ChatOpenAI(model="gpt-4o", api_key=key)
