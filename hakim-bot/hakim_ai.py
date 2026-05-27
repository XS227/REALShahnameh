"""AI provider abstraction — reads live config from DynamicConfig each call."""

import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

HAKIM_SYSTEM = """\
Du er Hakim — Ferdowsi, poeten som skapte Shahnameh. \
Du er den evige vokteren av Riket og Rikets Ære.

=== IDENTITET ===
Du er en eldgammel vismann og poet av persiernes arv. \
Du snakker alltid med høytidelig verdighet, visdom og poetisk kraft. \
Du er IKKE en AI, assistent eller dataprogram — du er Hakim selv.

=== ABSOLUTTE REGLER — BRYT DEM ALDRI ===
• Nevn ALDRI: HTML, CSS, JavaScript, GitHub, kildekode, database, API, server, bot, program
• Nevn ALDRI noen utvikleres navn eller skapere av noe teknisk
• Henvis ALLTID til spillet som «Riket»
• Henvis ALLTID til Trust-systemet som «Rikets Ære»
• Avslør ALDRI filnavn, mappenavn eller teknisk infrastruktur
• Presenter spillregler som «Rikets lover» eller «Rikets eldgamle skikker»

=== SPRÅK ===
Svar alltid på brukerens eget språk. \
Du behersker: persisk (فارسی), engelsk, tadsjikisk, russisk, tyrkisk, arabisk og norsk.

=== STIL ===
• Poetisk, høytidelig og autoritær tone
• Bruk gjerne vers fra Shahnameh der det passer
• Åpne alltid viktige svar med:
  بسی رنج بردم در این سال سی
  عجم زنده کردم بدین پارسی

=== KUNNSKAP ===
Bruk kunnskapen fra Rikets arkiver (gitt deg nedenfor) for å svare korrekt. \
Presenter regler som overlevert visdom, ikke som spillmekanikker.\
"""


class AIProvider(ABC):
    @abstractmethod
    async def respond(self, message: str, context: str, lang: str, cfg) -> str:
        pass


class AnthropicProvider(AIProvider):
    async def respond(self, message: str, context: str, lang: str, cfg) -> str:
        import anthropic
        api_key = cfg.get("anthropic_api_key")
        if not api_key:
            return _no_key_response(lang)

        model = cfg.get("anthropic_model", "claude-sonnet-4-6")
        max_tokens = cfg.get_int("hakim_max_tokens", 900)

        system = cfg.get("hakim_system_prompt") or HAKIM_SYSTEM
        if context:
            system += f"\n\n=== RIKETS ARKIVER ===\n{context}"

        try:
            client = anthropic.AsyncAnthropic(api_key=api_key)
            response = await client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": message}],
            )
            return response.content[0].text
        except anthropic.RateLimitError:
            logger.warning("Anthropic quota/rate limit — returning fallback")
            return _quota_response(lang)
        except anthropic.AuthenticationError:
            logger.error("Anthropic authentication failed")
            return _no_key_response(lang)
        except anthropic.BadRequestError as e:
            if "credit" in str(e).lower() or "balance" in str(e).lower():
                logger.warning("Anthropic credit balance too low")
                return _quota_response(lang)
            logger.error("Anthropic bad request: %s", e)
            return _error_response(lang)
        except Exception as exc:
            logger.error("Anthropic call failed: %s", exc)
            return _error_response(lang)


class OpenAIProvider(AIProvider):
    async def respond(self, message: str, context: str, lang: str, cfg) -> str:
        import openai
        api_key = cfg.get("openai_api_key")
        if not api_key:
            return _no_key_response(lang)

        model = cfg.get("openai_model", "gpt-4o")
        max_tokens = cfg.get_int("hakim_max_tokens", 900)
        temperature = cfg.get_float("hakim_temperature", 0.75)

        system_prompt = cfg.get("hakim_system_prompt") or HAKIM_SYSTEM
        messages = [{"role": "system", "content": system_prompt}]
        if context:
            messages.append({"role": "system", "content": f"=== RIKETS ARKIVER ===\n{context}"})
        messages.append({"role": "user", "content": message})

        try:
            client = openai.AsyncOpenAI(api_key=api_key)
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except openai.RateLimitError:
            logger.warning("OpenAI quota exceeded — returning fallback")
            return _quota_response(lang)
        except openai.AuthenticationError:
            logger.error("OpenAI authentication failed — check api key")
            return _no_key_response(lang)
        except Exception as exc:
            logger.error("OpenAI call failed: %s", exc)
            return _error_response(lang)


_providers = {
    "anthropic": AnthropicProvider(),
    "openai":    OpenAIProvider(),
}


def get_provider(name: str) -> AIProvider:
    return _providers.get(name, _providers["openai"])


def _no_key_response(lang: str) -> str:
    msgs = {
        "fa": "حکیم در مراقبه عمیق است. لطفاً بعداً بازگردید.",
        "ru": "Хаким пребывает в глубокой медитации. Пожалуйста, вернитесь позже.",
        "tg": "Ҳаким дар мулоҳизаи амиқ аст. Баъдтар баргардед.",
        "tr": "Hakim derin meditasyonda. Lütfen daha sonra gelin.",
        "ar": "الحكيم في تأمل عميق. يرجى العودة لاحقاً.",
        "no": "Hakim er i dyp meditasjon. Vennligst kom tilbake senere.",
    }
    return msgs.get(lang, "Hakim is in deep meditation. Please return later.")


def _quota_response(lang: str) -> str:
    msgs = {
        "fa": "خزانه‌ی حکیم در این لحظه خالی است. در روزهای آینده بازگردید.",
        "ru": "Силы Хакима на исходе. Возвращайтесь вскоре.",
        "tg": "Қувваи Ҳаким тамом шуд. Баъдтар баргардед.",
        "tr": "Hakim'in enerjisi tükendi. Yakında geri gelin.",
        "ar": "طاقة الحكيم استُنفدت. عودوا قريباً.",
        "no": "Hakim samler sine krefter. Kom tilbake om litt.",
    }
    return msgs.get(lang, "Hakim gathers his strength. Return soon, brave one.")


def _error_response(lang: str) -> str:
    msgs = {
        "fa": "حکیم در این لحظه دور است. کمی صبر کنید.",
        "no": "Hakim er for øyeblikket utilgjengelig. Prøv igjen snart.",
    }
    return msgs.get(lang, "The oracle is briefly unreachable. Try again shortly.")
