"""
AI Routes for FastAPI backend
Provides REST API endpoints for AI chat operations with multiple providers
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from ai_service import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatMessage(BaseModel):
    """Chat message model"""

    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    """Chat completion request model"""

    messages: List[ChatMessage]
    provider: str = "openai"  # "openai" | "claude" | "zai"
    model: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    stream: bool = False


class ModelInfo(BaseModel):
    """Model information"""

    provider: str
    models: List[str]


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Send a chat message to the specified AI provider.

    Supports:
    - OpenAI: gpt-4o, gpt-4-turbo, gpt-4-vision, gpt-4o-mini
    - Claude: opus-4.1, sonnet-4, haiku-3, fable, coder
    - Z.ai: glm-5-1, glm-5-2
    """
    try:
        # Convert messages to dict format
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # Get response
        response = ai_service.chat(
            messages=messages,
            provider=request.provider,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=request.stream,
        )

        # Handle streaming
        if request.stream:
            async def generate():
                try:
                    for chunk in response:
                        yield chunk
                except Exception as e:
                    yield f"Error: {str(e)}"

            return StreamingResponse(generate(), media_type="text/event-stream")

        # Handle non-streaming response
        return {
            "text": response.text,
            "model": response.model,
            "provider": response.provider.value,
            "usage": response.usage,
            "finish_reason": response.finish_reason,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI API error: {str(e)}")


@router.get("/models")
async def get_models():
    """Get all available models across all providers"""
    try:
        models = ai_service.get_available_models()
        return {"providers": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/{provider}")
async def get_provider_models(provider: str):
    """Get available models for a specific provider"""
    try:
        models = ai_service.get_provider_models(provider)
        return {
            "provider": provider,
            "models": models,
            "default": ai_service.get_default_model(provider),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid provider: {provider}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/completions")
async def completions(request: ChatRequest):
    """
    Legacy completions endpoint (alias for /chat)
    """
    return await chat(request)
