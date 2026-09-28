import logging
import httpx
from typing import List, Dict, Any, Tuple
from hindsight_client import Hindsight
from backend.config import settings

logger = logging.getLogger("hindsight_service")

class HindsightService:
    @property
    def bank_id(self) -> str:
        return settings.HINDSIGHT_BANK_ID

    @property
    def base_url(self) -> str:
        return settings.HINDSIGHT_API_URL.rstrip('/')

    @property
    def api_key(self) -> str:
        return settings.HINDSIGHT_API_KEY

    def _get_client(self) -> Hindsight:
        return Hindsight(
            base_url=self.base_url,
            api_key=self.api_key if self.api_key else None,
            timeout=30.0
        )

    def check_connection(self) -> Tuple[bool, str]:
        """Verify Hindsight Cloud connection status."""
        if not self.api_key or self.api_key.startswith("your_"):
            return False, "Hindsight API key not configured in .env"
        try:
            client = self._get_client()
            # Attempt version check
            try:
                version = client.get_version()
                return True, f"Connected to Hindsight Cloud ({version})"
            except Exception:
                # Direct HTTP health check fallback
                headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                with httpx.Client(timeout=5.0) as http_client:
                    res = http_client.get(f"{self.base_url}/health", headers=headers)
                    if res.status_code in (200, 204, 404):
                        return True, "Hindsight Cloud reachable"
                    return False, f"Hindsight returned status code {res.status_code}"
        except Exception as e:
            return False, f"Hindsight connection error: {str(e)}"

    def retain(self, content: str, metadata: Dict[str, Any] = None, tags: List[str] = None) -> Tuple[bool, str]:
        """
        Retain a memory in Hindsight Cloud.
        Compulsory: Must communicate with Hindsight.
        """
        if not self.api_key or self.api_key.startswith("your_"):
            return False, "Hindsight API key not configured in .env"

        meta_str = {k: str(v) for k, v in (metadata or {}).items()}
        try:
            client = self._get_client()
            res = client.retain(
                bank_id=self.bank_id,
                content=content,
                metadata=meta_str,
                tags=tags or []
            )
            return True, f"Memory Stored (ID: {getattr(res, 'id', 'stored')})"
        except Exception as e:
            logger.error(f"Hindsight SDK retain failed: {e}")
            # Try direct REST API POST as robust fallback
            try:
                url = f"{self.base_url}/v1/default/banks/{self.bank_id}/retain"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                payload = {
                    "content": content,
                    "metadata": meta_str,
                    "tags": tags or []
                }
                with httpx.Client(timeout=15.0) as http_client:
                    resp = http_client.post(url, json=payload, headers=headers)
                    if resp.status_code in (200, 201, 202):
                        return True, "Memory Stored via Hindsight REST API"
                    else:
                        return False, f"Hindsight REST API HTTP {resp.status_code}: {resp.text}"
            except Exception as http_err:
                return False, f"Hindsight RETAIN operation failed: {str(http_err)}"

    def recall(self, query: str, limit: int = 10) -> Tuple[bool, List[Dict[str, Any]], str]:
        """
        Recall historical memories from Hindsight Cloud relevant to the query.
        """
        if not self.api_key or self.api_key.startswith("your_"):
            return False, [], "Hindsight API key not configured in .env"

        try:
            client = self._get_client()
            recall_resp = client.recall(
                bank_id=self.bank_id,
                query=query
            )
            
            results = []
            if hasattr(recall_resp, 'results') and recall_resp.results:
                for item in recall_resp.results:
                    text_val = getattr(item, 'text', '') or getattr(item, 'content', '') or str(item)
                    item_id = getattr(item, 'id', None)
                    score = None
                    if hasattr(item, 'scores') and item.scores:
                        score = list(item.scores.values())[0] if isinstance(item.scores, dict) else None
                    meta = getattr(item, 'metadata', {})
                    item_type = getattr(item, 'type', 'memory')
                    
                    results.append({
                        "id": item_id,
                        "content": text_val,
                        "score": score,
                        "type": item_type,
                        "metadata": meta
                    })
            
            return True, results, f"Recalled {len(results)} memories from Hindsight Cloud"
        except Exception as e:
            logger.error(f"Hindsight SDK recall failed: {e}")
            # Try REST API fallback
            try:
                url = f"{self.base_url}/v1/default/banks/{self.bank_id}/recall"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
                payload = {"query": query}
                with httpx.Client(timeout=15.0) as http_client:
                    resp = http_client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_results = data.get("results", [])
                        results = []
                        for r in raw_results:
                            results.append({
                                "id": r.get("id"),
                                "content": r.get("text") or r.get("content") or str(r),
                                "score": r.get("score"),
                                "type": r.get("type", "memory"),
                                "metadata": r.get("metadata", {})
                            })
                        return True, results, f"Recalled {len(results)} memories via REST API"
                    else:
                        return False, [], f"Hindsight HTTP {resp.status_code}: {resp.text}"
            except Exception as http_err:
                return False, [], f"Hindsight RECALL failed: {str(http_err)}"

hindsight_service = HindsightService()
