import uuid
from backend.models.schemas import ProductUpdateInput, ProductUpdateResponse
from backend.services.hindsight_service import hindsight_service
from backend.storage import load_updates, save_updates

class ProductUpdateService:
    def process_update(self, item: ProductUpdateInput) -> ProductUpdateResponse:
        updates = load_updates()
        
        # Deduplication check: match by version, product_area, and date
        existing_idx = None
        for idx, u in enumerate(updates):
            if (u.get("version", "").strip().lower() == item.version.strip().lower() and
                u.get("product_area", "").strip().lower() == item.product_area.strip().lower() and
                u.get("date", "").strip() == item.date.strip()):
                existing_idx = idx
                break

        # If matching update already exists and is stored in Hindsight, return existing idempotently
        if existing_idx is not None and updates[existing_idx].get("hindsight_status") == "Memory Stored":
            rec = updates[existing_idx]
            # Update change description if changed
            if rec.get("change") != item.change:
                rec["change"] = item.change
                save_updates(updates)
            return ProductUpdateResponse(
                id=rec["id"],
                version=rec["version"],
                product_area=rec["product_area"],
                date=rec["date"],
                change=rec["change"],
                hindsight_status=rec["hindsight_status"],
                hindsight_detail=rec.get("hindsight_detail", "Memory Stored")
            )

        # Semantic memory formatting for Hindsight
        semantic_memory = (
            f"Product Update | Version: {item.version} | Date: {item.date} | "
            f"Product Area: {item.product_area} | Change Description: \"{item.change}\""
        )

        metadata = {
            "type": "product_update",
            "version": item.version,
            "product_area": item.product_area,
            "date": item.date
        }

        tags = ["product_update", item.version.lower(), item.product_area.lower().replace(" ", "_")]

        retained, status_msg = hindsight_service.retain(
            content=semantic_memory,
            metadata=metadata,
            tags=tags
        )

        hindsight_status = "Memory Stored" if retained else "Memory Failed"

        if existing_idx is not None:
            # Update existing record in-place
            updates[existing_idx]["change"] = item.change
            updates[existing_idx]["hindsight_status"] = hindsight_status
            updates[existing_idx]["hindsight_detail"] = status_msg
            record = updates[existing_idx]
        else:
            record = {
                "id": f"up_{uuid.uuid4().hex[:8]}",
                "version": item.version,
                "product_area": item.product_area,
                "date": item.date,
                "change": item.change,
                "hindsight_status": hindsight_status,
                "hindsight_detail": status_msg
            }
            updates.insert(0, record)

        save_updates(updates)

        return ProductUpdateResponse(
            id=record["id"],
            version=record["version"],
            product_area=record["product_area"],
            date=record["date"],
            change=record["change"],
            hindsight_status=hindsight_status,
            hindsight_detail=status_msg
        )

product_update_service = ProductUpdateService()
