# Role-Based Access Control (RBAC) & Authority Rules

## 1. Top-Down Authority Hierarchy

An upstream admin inherits administrative rights over downstream resources.



## 2. Board Visibility Rules

* **PRIVATE:** Visible only to explicit `BOARD_MEMBERS` and the parent `Workspace ADMIN`.
* **WORKSPACE:** Visible to all members of the parent workspace (`WORKSPACE_MEMBERS`). Modifying content requires `Board MEMBER`, `Board ADMIN`, or `Workspace ADMIN` authority.
* **PUBLIC:** Readable by any authenticated system user. Modifying content requires explicit board membership (`MEMBER`/`ADMIN`) or `Workspace ADMIN` role.

## 3. Core Business Constraints

* **Polymorphic Activity Logs:** `entity_type` (`BOARD | LIST | CARD`) + `entity_id` is an application-level polymorphic link, not an enforced foreign key at the DB layer.
* **Intra-Board Movement Only:** Moving a card between lists is restricted to lists sharing the same `board_id`.