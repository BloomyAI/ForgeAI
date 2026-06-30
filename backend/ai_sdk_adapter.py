"""
AI SDK Adapter for multiple LLM providers.
Supports: OpenAI, Claude (Anthropic), and Z.ai (Zhipu AI)
"""

import os
import json
from typing import Optional, Generator, Dict, List, Any
from enum import Enum
from dataclasses import dataclass
from abc import ABC, abstractmethod


class AIProvider(str, Enum):
    """Supported AI providers"""
    OPENAI = "openai"
    CLAUDE = "claude"
    ZAI = "zai"  # Zhipu AI / GLM


class OpenAIModel(str, Enum):
    """OpenAI latest models"""
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_4_VISION = "gpt-4-vision"
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"


class ClaudeModel(str, Enum):
    """Claude latest models"""
    OPUS_4_1 = "claude-3-5-opus-20241022"  # Claude 3.5 Opus
    SONNET_4 = "claude-3-5-sonnet-20241022"  # Claude 3.5 Sonnet
    HAIKU_3 = "claude-3-5-haiku-20241022"  # Claude 3.5 Haiku
    FABLE = "claude-3-haiku-20240307"  # Fable (alias for Haiku)
    CODER = "claude-3-5-sonnet-20241022"  # Code specialist (Sonnet)


class ZaiModel(str, Enum):
    """Z.ai (Zhipu AI) latest models"""
    GLM_5_1 = "glm-5-1"
    GLM_5_2 = "glm-5-2"


@dataclass
class Message:
    """Message structure for API calls"""
    role: str  # "user" | "assistant" | "system"
    content: str


@dataclass
class AIResponse:
    """Response structure from AI providers"""
    text: str
    model: str
    provider: AIProvider
    usage: Optional[Dict[str, int]] = None
    finish_reason: Optional[str] = None


class AIProviderClient(ABC):
    """Abstract base class for AI provider clients"""

    @abstractmethod
    def chat_completion(
        self,
        messages: List[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
    ) -> AIResponse | Generator[str, None, None]:
        """Send a chat completion request"""
        pass

    @abstractmethod
    def list_models(self) -> List[str]:
        """List available models for this provider"""
        pass


class OpenAIClient(AIProviderClient):
    """OpenAI API client"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")

        try:
            import openai
            self.client = openai.OpenAI(api_key=self.api_key)
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")

    def chat_completion(
        self,
        messages: List[Message],
        model: str = OpenAIModel.GPT_4O.value,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
    ) -> AIResponse | Generator[str, None, None]:
        """Send a chat completion request to OpenAI"""

        formatted_messages = [
            {"role": msg.role, "content": msg.content} for msg in messages
        ]

        try:
            if stream:
                return self._stream_completion(
                    formatted_messages, model, temperature, max_tokens
                )
            else:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=formatted_messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                return AIResponse(
                    text=response.choices[0].message.content,
                    model=model,
                    provider=AIProvider.OPENAI,
                    usage={
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens,
                    },
                    finish_reason=response.choices[0].finish_reason,
                )
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    def _stream_completion(
        self,
        messages: List[Dict],
        model: str,
        temperature: float,
        max_tokens: Optional[int],
    ) -> Generator[str, None, None]:
        """Stream completions from OpenAI"""
        with self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        ) as response:
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

    def list_models(self) -> List[str]:
        """List available OpenAI models"""
        return [model.value for model in OpenAIModel]


class ClaudeClient(AIProviderClient):
    """Anthropic Claude API client"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")

        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=self.api_key)
        except ImportError:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")

    def chat_completion(
        self,
        messages: List[Message],
        model: str = ClaudeModel.OPUS_4_1.value,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        stream: bool = False,
    ) -> AIResponse | Generator[str, None, None]:
        """Send a chat completion request to Claude"""

        formatted_messages = [
            {"role": msg.role, "content": msg.content} for msg in messages
        ]

        try:
            if stream:
                return self._stream_completion(
                    formatted_messages, model, temperature, max_tokens
                )
            else:
                response = self.client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    messages=formatted_messages,
                    temperature=temperature,
                )

                return AIResponse(
                    text=response.content[0].text,
                    model=model,
                    provider=AIProvider.CLAUDE,
                    usage={
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                    },
                    finish_reason=response.stop_reason,
                )
        except Exception as e:
            raise Exception(f"Claude API error: {str(e)}")

    def _stream_completion(
        self,
        messages: List[Dict],
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> Generator[str, None, None]:
        """Stream completions from Claude"""
        with self.client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            messages=messages,
            temperature=temperature,
        ) as stream:
            for text in stream.text_stream:
                yield text

    def list_models(self) -> List[str]:
        """List available Claude models"""
        return [model.value for model in ClaudeModel]


class ZaiClient(AIProviderClient):
    """Zhipu AI (Z.ai) API client for GLM models"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ZAI_API_KEY")
        if not self.api_key:
            raise ValueError("ZAI_API_KEY not found in environment")

        try:
            import zhipuai
            zhipuai.api_key = self.api_key
            self.client = zhipuai
        except ImportError:
            raise ImportError("zhipuai package not installed. Run: pip install zhipuai")

    def chat_completion(
        self,
        messages: List[Message],
        model: str = ZaiModel.GLM_5_2.value,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
    ) -> AIResponse | Generator[str, None, None]:
        """Send a chat completion request to Zhipu AI"""

        formatted_messages = [
            {"role": msg.role, "content": msg.content} for msg in messages
        ]

        try:
            response = self.client.model_api.invoke(
                model=model,
                prompt=formatted_messages,
                temperature=temperature,
                top_p=0.95,
            )

            if response["code"] != 200:
                raise Exception(f"Zhipu AI API error: {response['msg']}")

            if stream:
                return self._handle_stream_response(response, model)
            else:
                return AIResponse(
                    text=response["data"]["choices"][0]["content"],
                    model=model,
                    provider=AIProvider.ZAI,
                    usage={
                        "prompt_tokens": response["data"]["usage"]["prompt_tokens"],
                        "completion_tokens": response["data"]["usage"][
                            "completion_tokens"
                        ],
                        "total_tokens": response["data"]["usage"]["total_tokens"],
                    },
                    finish_reason=response["data"]["choices"][0].get("finish_reason"),
                )
        except Exception as e:
            raise Exception(f"Zhipu AI API error: {str(e)}")

    def _handle_stream_response(
        self, response: Dict[str, Any], model: str
    ) -> Generator[str, None, None]:
        """Handle streaming response from Zhipu AI"""
        if response.get("data", {}).get("choices"):
            for choice in response["data"]["choices"]:
                yield choice.get("content", "")

    def list_models(self) -> List[str]:
        """List available Z.ai models"""
        return [model.value for model in ZaiModel]


class AISDKAdapter:
    """Main adapter for managing multiple AI providers"""

    def __init__(self):
        self.clients: Dict[AIProvider, AIProviderClient] = {}
        self._initialize_clients()

    def _initialize_clients(self):
        """Initialize all available AI provider clients"""
        # Initialize OpenAI
        try:
            self.clients[AIProvider.OPENAI] = OpenAIClient()
        except (ValueError, ImportError) as e:
            print(f"Warning: OpenAI client not available: {e}")

        # Initialize Claude
        try:
            self.clients[AIProvider.CLAUDE] = ClaudeClient()
        except (ValueError, ImportError) as e:
            print(f"Warning: Claude client not available: {e}")

        # Initialize Z.ai
        try:
            self.clients[AIProvider.ZAI] = ZaiClient()
        except (ValueError, ImportError) as e:
            print(f"Warning: Z.ai client not available: {e}")

    def get_client(self, provider: AIProvider) -> AIProviderClient:
        """Get a specific provider client"""
        if provider not in self.clients:
            raise ValueError(f"Provider {provider} not initialized")
        return self.clients[provider]

    def chat_completion(
        self,
        messages: List[Message],
        provider: AIProvider,
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
    ) -> AIResponse | Generator[str, None, None]:
        """Send a chat completion request to the specified provider"""
        client = self.get_client(provider)
        return client.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
        )

    def list_available_providers(self) -> Dict[str, List[str]]:
        """List all available providers and their models"""
        available = {}
        for provider, client in self.clients.items():
            available[provider.value] = client.list_models()
        return available

    def get_default_model(self, provider: AIProvider) -> str:
        """Get the default (latest/best) model for a provider"""
        defaults = {
            AIProvider.OPENAI: OpenAIModel.GPT_4O.value,
            AIProvider.CLAUDE: ClaudeModel.OPUS_4_1.value,
            AIProvider.ZAI: ZaiModel.GLM_5_2.value,
        }
        return defaults.get(provider, "")


# Convenience function for quick initialization
def create_ai_adapter() -> AISDKAdapter:
    """Create and return an initialized AI SDK adapter"""
    return AISDKAdapter()
