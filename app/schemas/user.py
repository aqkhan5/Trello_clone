from datetime import datetime
from uuid import UUID

import dns.exception
import dns.resolver
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def has_valid_mx_record(domain: str) -> bool:
    """Verify if a domain has valid Mail Exchange (MX) records."""
    try:
        records = dns.resolver.resolve(domain, "MX")
        return bool(records)
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.DNSException):
        return False


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_real_domain(cls, v: str) -> str:
        domain = v.split("@")[-1]
        if not has_valid_mx_record(domain):
            raise ValueError(
                f"The domain '{domain}' does not accept emails or does not exist."
            )
        return v.lower()


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=100)