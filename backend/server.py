from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, Response, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
from auth import get_session_data, save_user_session, set_session_cookie, get_current_user, require_auth, logout_user


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="FinanceApp API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Add exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error on {request.url}: {exc.errors()}")
    logger.error(f"Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(await request.body())}
    )


# ============================================================================
# HELPER FUNCTIONS FOR DATA CONVERSION
# ============================================================================
def convert_camel_to_snake(data: dict, field_mappings: dict) -> dict:
    """Convert camelCase fields to snake_case for backward compatibility"""
    for camel, snake in field_mappings.items():
        if camel in data and snake not in data:
            data[snake] = data[camel]
    return data

def convert_dates_from_string(data: dict, date_fields: list) -> dict:
    """Convert ISO string dates to datetime objects"""
    for field in date_fields:
        if field in data and isinstance(data.get(field), str):
            try:
                data[field] = datetime.fromisoformat(data[field])
            except:
                pass
    return data

# Common field mappings for different models
TRANSACTION_FIELD_MAP = {
    'accountId': 'account_id',
    'toAccountId': 'to_account_id',
    'linkedTo': 'linked_investment_id',
    'linkedInvestmentId': 'linked_investment_id',
    'isRecurring': 'is_recurring',
    'recurringFrequency': 'recurring_frequency',
    'recurringNextDate': 'recurring_next_date',
    'receiptUrl': 'receipt_url',
    'createdAt': 'created_at'
}

INVESTMENT_FIELD_MAP = {
    'averagePrice': 'average_price',
    'currentPrice': 'current_price',
    'purchaseDate': 'purchase_date',
    'initialValue': 'initial_value',
    'depreciationRate': 'depreciation_rate',
    'monthlyCosts': 'monthly_costs',
    'linkedTransactionId': 'linked_transaction_id',
    'createdAt': 'created_at'
}

GOAL_FIELD_MAP = {
    'targetAmount': 'target_amount',
    'currentAmount': 'current_amount',
    'targetDate': 'deadline',
    'createdAt': 'created_at'
}

DEBT_FIELD_MAP = {
    'totalAmount': 'total_amount',
    'remainingAmount': 'remaining_amount',
    'interestRate': 'interest_rate',
    'dueDate': 'due_date',
    'accountId': 'account_id',
    'createdAt': 'created_at',
    'linkedTransactionId': 'linked_transaction_id'
}

RECEIVABLE_FIELD_MAP = {
    'totalAmount': 'total_amount',
    'remainingAmount': 'remaining_amount',
    'dueDate': 'due_date',
    'accountId': 'account_id',
    'createdAt': 'created_at',
    'linkedTransactionId': 'linked_transaction_id'
}

ACCOUNT_FIELD_MAP = {
    'initialBalance': 'initial_balance',
    'currentBalance': 'current_balance',
    'isExcludedFromTotal': 'is_excluded_from_total',
    'bankConnected': 'bank_connected',
    'bankConnectionId': 'bank_connection_id',
    'createdAt': 'created_at'
}


# ============================================================================
# ENUMS
# ============================================================================
class TransactionType(str, Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class InvestmentOperationType(str, Enum):
    buy = "buy"
    sell = "sell"
    dividend = "dividend"
    deposit = "deposit"  # For trading accounts
    withdrawal = "withdrawal"  # For trading accounts
    interest = "interest"  # For bonds
    rental_income = "rental_income"  # For real estate
    mining_reward = "mining_reward"  # For mining rigs
    maintenance = "maintenance"  # For mining rigs, real estate

class InvestmentTypeEnum(str, Enum):
    stock = "stock"  # Valeur par unité
    crypto = "crypto"  # Valeur par unité
    trading_account = "trading_account"  # Valeur totale
    bond = "bond"  # Intérêts sans unités
    real_estate = "real_estate"  # Plus-value + revenus locatifs
    mining_rig = "mining_rig"  # Dépréciation + revenus mining
    etf = "etf"  # Valeur par unité
    commodity = "commodity"  # Valeur par unité

class CurrencyEnum(str, Enum):
    EUR = "EUR"
    USD = "USD"
    CHF = "CHF"
    BTC = "BTC"
    ETH = "ETH"
    GBP = "GBP"


# ============================================================================
# MODELS - ACCOUNTS
# ============================================================================
class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = "checking"  # checking, savings, investment, cash, crypto
    currency: str = "EUR"  # Changed back to str for backward compatibility
    initial_balance: float = 0.0
    current_balance: float = 0.0
    icon: Optional[str] = "wallet"
    color: Optional[str] = "#4f46e5"
    is_excluded_from_total: bool = False
    bank_connected: bool = False  # For automatic sync
    bank_connection_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountCreate(BaseModel):
    name: str
    type: str = "checking"
    currency: str = "EUR"  # Changed back to str for backward compatibility
    initial_balance: float = 0.0
    icon: Optional[str] = "wallet"
    color: Optional[str] = "#4f46e5"
    is_excluded_from_total: bool = False
    bank_connected: bool = False
    bank_connection_id: Optional[str] = None


# ============================================================================
# MODELS - TRANSACTIONS
# ============================================================================
class SplitItem(BaseModel):
    category: str
    amount: float
    note: Optional[str] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    type: TransactionType
    amount: float
    category: str
    description: str
    date: datetime
    to_account_id: Optional[str] = None  # For transfers
    linked_investment_id: Optional[str] = None  # Link to investment
    linked_debt_id: Optional[str] = None  # Link to debt
    linked_receivable_id: Optional[str] = None  # Link to receivable
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None  # daily, weekly, monthly, yearly
    recurring_next_date: Optional[datetime] = None  # When next transaction should be created
    splits: Optional[List[SplitItem]] = None  # For split transactions
    tags: List[str] = []
    receipt_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    account_id: str
    type: TransactionType
    amount: float
    category: str
    description: str
    date: datetime
    to_account_id: Optional[str] = None
    linked_debt_id: Optional[str] = None  # Link to debt
    linked_receivable_id: Optional[str] = None  # Link to receivable
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    splits: Optional[List[SplitItem]] = None
    tags: List[str] = Field(default_factory=list)


# ============================================================================
# MODELS - INVESTMENTS
# ============================================================================
class InvestmentOperation(BaseModel):
    date: datetime
    type: InvestmentOperationType
    quantity: float
    price: float
    fees: float = 0.0
    total: float
    notes: str = ""

class Investment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    symbol: str = ""  # Made optional with default empty string for backward compatibility
    type: str = "stock"  # Changed back to str for backward compatibility
    quantity: float = 0.0
    average_price: float = 0.0
    current_price: float = 0.0
    currency: str = "EUR"  # Changed back to str for backward compatibility
    operations: List[InvestmentOperation] = []
    # Additional fields for specific types
    purchase_date: Optional[datetime] = None  # For real estate, mining rigs
    initial_value: Optional[float] = None  # For trading accounts, real estate
    depreciation_rate: Optional[float] = None  # For mining rigs (annual %)
    monthly_costs: Optional[float] = None  # For real estate, mining rigs
    linked_transaction_id: Optional[str] = None  # Link to transaction
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvestmentCreate(BaseModel):
    name: str
    symbol: str = ""  # Made optional with default empty string
    type: str = "stock"  # Changed back to str for backward compatibility
    currency: str = "EUR"  # Changed back to str for backward compatibility
    purchase_date: Optional[datetime] = None
    initial_value: Optional[float] = None
    depreciation_rate: Optional[float] = None
    monthly_costs: Optional[float] = None

class InvestmentUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    name: Optional[str] = None
    symbol: Optional[str] = None
    type: Optional[str] = None
    quantity: Optional[float] = None
    average_price: Optional[float] = None
    current_price: Optional[float] = None
    currency: Optional[str] = None
    operations: Optional[List[InvestmentOperation]] = None
    purchase_date: Optional[datetime] = None
    initial_value: Optional[float] = None
    depreciation_rate: Optional[float] = None
    monthly_costs: Optional[float] = None
    linked_transaction_id: Optional[str] = None

class InvestmentOperationCreate(BaseModel):
    date: datetime
    type: InvestmentOperationType
    quantity: float
    price: float
    fees: float = 0.0
    notes: str = ""


# ============================================================================
# MODELS - GOALS (OBJECTIFS)
# ============================================================================
class Goal(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    target_amount: float = Field(alias='targetAmount')
    current_amount: float = Field(default=0.0, alias='currentAmount')
    deadline: Optional[datetime] = Field(default=None, alias='targetDate')
    category: str = "savings"
    color: Optional[str] = "#10b981"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[datetime] = None
    category: str = "savings"
    color: Optional[str] = "#10b981"


# ============================================================================
# MODELS - DEBTS (DETTES)
# ============================================================================
class DebtPayment(BaseModel):
    date: datetime
    amount: float
    notes: Optional[str] = None
    linked_transaction_id: Optional[str] = None

class Debt(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    total_amount: Optional[float] = Field(default=0, alias='totalAmount')
    remaining_amount: Optional[float] = Field(default=0, alias='remainingAmount')
    interest_rate: float = Field(default=0.0, alias='interestRate')
    creditor: Optional[str] = None
    due_date: Optional[datetime] = Field(default=None, alias='dueDate')
    payments: List[DebtPayment] = Field(default_factory=list)
    history: Optional[List[dict]] = None  # Old format compatibility
    account_id: Optional[str] = Field(default=None, alias='accountId')
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DebtCreate(BaseModel):
    name: str
    total_amount: float
    remaining_amount: float
    interest_rate: float = 0.0
    creditor: str
    due_date: Optional[datetime] = None
    account_id: Optional[str] = None

class DebtPaymentCreate(BaseModel):
    date: datetime
    amount: float
    notes: Optional[str] = None


# ============================================================================
# MODELS - CATEGORIES
# ============================================================================
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = "expense"  # expense, income
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366f1"
    budget: Optional[float] = None
    parent_id: Optional[str] = None  # For subcategories
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    type: str = "expense"
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366f1"
    budget: Optional[float] = None
    parent_id: Optional[str] = None

# Payee/Location model
class Payee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = "merchant"  # merchant, company, person
    default_category_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PayeeCreate(BaseModel):
    name: str
    type: str = "merchant"
    default_category_id: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# MODELS - RECEIVABLES (CRÉANCES)
# ============================================================================
class ReceivablePayment(BaseModel):
    date: datetime
    amount: float
    notes: Optional[str] = None
    linked_transaction_id: Optional[str] = None

class Receivable(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    total_amount: Optional[float] = None  # For backward compatibility
    remaining_amount: Optional[float] = None  # For backward compatibility
    amount: Optional[float] = None  # Old field - for backward compatibility
    debtor: str
    due_date: Optional[datetime] = None
    payments: List[ReceivablePayment] = []
    account_id: Optional[str] = None  # Link to account
    is_paid: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReceivableCreate(BaseModel):
    name: str
    total_amount: Optional[float] = 0
    remaining_amount: Optional[float] = 0
    amount: Optional[float] = 0  # For backward compatibility
    debtor: str
    due_date: Optional[datetime] = None
    account_id: Optional[str] = None

class ReceivablePaymentCreate(BaseModel):
    date: datetime
    amount: float
    notes: Optional[str] = None
    is_paid: bool = False


# ============================================================================
# MODELS - SHOPPING (COURSES)
# ============================================================================
class PurchaseHistory(BaseModel):
    date: datetime
    location: str
    price: float
    quantity: int = 1

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str = "general"
    usual_price: float = 0.0
    current_price: Optional[float] = None
    is_on_sale: bool = False
    last_purchased_date: Optional[datetime] = None
    last_purchased_location: Optional[str] = None
    locations: List[str] = []  # List of stores where available
    purchase_history: List[PurchaseHistory] = []  # Full purchase history
    price_alert_threshold: Optional[float] = None  # Alert when price drops below this
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    category: str = "general"
    usual_price: float = 0.0
    current_price: Optional[float] = None
    is_on_sale: bool = False
    last_purchased_location: Optional[str] = None
    locations: List[str] = []
    notes: Optional[str] = None

class ShoppingListItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int = 1
    is_checked: bool = False

class ShoppingList(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    items: List[ShoppingListItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed: bool = False

class ShoppingListCreate(BaseModel):
    name: str
    items: List[ShoppingListItem] = []


# ============================================================================
# MODELS - TASKS & EISENHOWER MATRIX
# ============================================================================
class EisenhowerQuadrant(str, Enum):
    urgent_important = "urgent_important"  # Do First
    not_urgent_important = "not_urgent_important"  # Schedule
    urgent_not_important = "urgent_not_important"  # Delegate
    not_urgent_not_important = "not_urgent_not_important"  # Eliminate

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    quadrant: Optional[EisenhowerQuadrant] = None  # Null = uncategorized
    estimated_cost: Optional[float] = None
    priority: int = 0  # 0-5
    due_date: Optional[datetime] = None
    completed: bool = False
    tags: List[str] = []
    linked_transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    quadrant: Optional[EisenhowerQuadrant] = None  # Null = uncategorized
    estimated_cost: Optional[float] = None
    priority: int = 0
    due_date: Optional[datetime] = None
    tags: List[str] = []


# ============================================================================
# MODELS - USER PREFERENCES
# ============================================================================
class UserPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    preferred_currency: CurrencyEnum = CurrencyEnum.EUR
    date_format: str = "DD/MM/YYYY"
    language: str = "fr"
    dashboard_view: str = "grid"  # grid, list
    enable_notifications: bool = True
    auto_categorize: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserPreferencesUpdate(BaseModel):
    preferred_currency: Optional[CurrencyEnum] = None
    date_format: Optional[str] = None
    language: Optional[str] = None
    dashboard_view: Optional[str] = None
    enable_notifications: Optional[bool] = None
    auto_categorize: Optional[bool] = None


# ============================================================================
# MODELS - BANK INTEGRATION
# ============================================================================
class BankConnection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bank_name: str
    account_id: str  # Link to our Account model
    connection_status: str = "active"  # active, disconnected, error
    last_sync: Optional[datetime] = None
    access_token: Optional[str] = None  # Encrypted in production
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BankConnectionCreate(BaseModel):
    bank_name: str
    account_id: str
    access_token: Optional[str] = None


# ============================================================================
# API ROUTES - ACCOUNTS
# ============================================================================
@api_router.post("/accounts", response_model=Account)
async def create_account(input: AccountCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    account = Account(**input.model_dump(), current_balance=input.initial_balance)
    doc = account.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_email'] = user_email  # Add user ownership
    await db.accounts.insert_one(doc)
    return account

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(request: Request):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    accounts = await db.accounts.find(query, {"_id": 0}).to_list(1000)
    for acc in accounts:
        # Convert camelCase to snake_case
        acc = convert_camel_to_snake(acc, ACCOUNT_FIELD_MAP)
        
        # Handle dates
        acc = convert_dates_from_string(acc, ['created_at'])
    return accounts

@api_router.get("/accounts/{account_id}", response_model=Account)
async def get_account(account_id: str, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    account = await db.accounts.find_one({"id": account_id, "user_email": user_email}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if isinstance(account.get('created_at'), str):
        account['created_at'] = datetime.fromisoformat(account['created_at'])
    return account

@api_router.put("/accounts/{account_id}", response_model=Account)
async def update_account(account_id: str, input: AccountCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    account = await db.accounts.find_one({"id": account_id, "user_email": user_email}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_data = input.model_dump()
    result = await db.accounts.update_one({"id": account_id, "user_email": user_email}, {"$set": update_data})
    
    updated = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    result = await db.accounts.delete_one({"id": account_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted successfully"}

@api_router.post("/accounts/transfer")
async def transfer_between_accounts(
    from_account_id: str,
    to_account_id: str,
    amount: float,
    description: str = "Transfer",
    request: Request = None
):
    """Transfer money between accounts with currency conversion if needed"""
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    # Get both accounts
    from_account = await db.accounts.find_one({"id": from_account_id, "user_email": user_email}, {"_id": 0})
    to_account = await db.accounts.find_one({"id": to_account_id, "user_email": user_email}, {"_id": 0})
    
    if not from_account or not to_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Update balances
    new_from_balance = from_account['current_balance'] - amount
    await db.accounts.update_one(
        {"id": from_account_id, "user_email": user_email},
        {"$set": {"current_balance": new_from_balance}}
    )
    
    # If currencies are different, convert
    converted_amount = amount
    if from_account['currency'] != to_account['currency']:
        # Simple conversion for now - in production, use real API
        conversion_rates = {
            "EUR_USD": 1.10, "USD_EUR": 0.91,
            "EUR_CHF": 0.95, "CHF_EUR": 1.05,
            "USD_CHF": 0.86, "CHF_USD": 1.16,
            "BTC_USD": 45000, "USD_BTC": 1/45000,
            "BTC_EUR": 41000, "EUR_BTC": 1/41000,
        }
        pair = f"{from_account['currency']}_{to_account['currency']}"
        rate = conversion_rates.get(pair, 1.0)
        converted_amount = amount * rate
    
    new_to_balance = to_account['current_balance'] + converted_amount
    await db.accounts.update_one(
        {"id": to_account_id, "user_email": user_email},
        {"$set": {"current_balance": new_to_balance}}
    )
    
    # Create transaction records
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    
    # Outgoing transaction
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "account_id": from_account_id,
        "type": "transfer",
        "amount": amount,
        "category": "Transfer",
        "description": f"{description} (to {to_account['name']})",
        "date": now,
        "to_account_id": to_account_id,
        "user_email": user_email,
        "created_at": now
    })
    
    # Incoming transaction
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "account_id": to_account_id,
        "type": "transfer",
        "amount": converted_amount,
        "category": "Transfer",
        "description": f"{description} (from {from_account['name']})",
        "date": now,
        "to_account_id": from_account_id,
        "user_email": user_email,
        "created_at": now
    })
    
    return {
        "message": "Transfer successful",
        "from_account": from_account['name'],
        "to_account": to_account['name'],
        "amount": amount,
        "converted_amount": converted_amount,
        "from_currency": from_account['currency'],
        "to_currency": to_account['currency']
    }

@api_router.get("/currency/rates")
async def get_currency_rates(base: str = "EUR"):
    """Get current exchange rates"""
    # In production, use a real API like frankfurter or exchangerate-api
    rates = {
        "EUR": 1.0,
        "USD": 1.10,
        "CHF": 0.95,
        "GBP": 0.86,
        "BTC": 0.000024,  # 1 EUR = 0.000024 BTC
        "ETH": 0.00044
    }
    
    if base != "EUR":
        # Convert all rates to the new base
        base_rate = rates.get(base, 1.0)
        rates = {k: v / base_rate for k, v in rates.items()}
    
    return {"base": base, "rates": rates, "timestamp": datetime.now(timezone.utc).isoformat()}


# ============================================================================
# API ROUTES - TRANSACTIONS
# ============================================================================
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    # Log authentication status and input data for debugging
    logger.info(f"Creating transaction - User: {user_email}, Has Cookie: {request.cookies.get('session_token') is not None}")
    logger.info(f"Transaction input data: {input.model_dump()}")
    
    transaction = Transaction(**input.model_dump())
    doc = transaction.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_email'] = user_email  # Add user ownership
    
    # Check for duplicate (same id, user_email, and created_at within 1 second)
    existing = await db.transactions.find_one({
        "id": doc['id'],
        "user_email": user_email
    })
    
    if existing:
        logger.warning(f"Duplicate transaction detected: {doc['id']} for user {user_email}")
        # Return existing transaction instead of creating duplicate
        return Transaction(**{**existing, '_id': str(existing.get('_id'))})
    
    await db.transactions.insert_one(doc)
    logger.info(f"Transaction created successfully: {doc['id']} for user {user_email}")
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    request: Request,
    account_id: Optional[str] = None,
    type: Optional[TransactionType] = None,
    limit: int = Query(default=10000, le=50000)
):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    if account_id:
        query["account_id"] = account_id
        # Also check camelCase version
        if not await db.transactions.count_documents(query):
            query["accountId"] = account_id
            del query["account_id"]
    if type:
        query["type"] = type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    for txn in transactions:
        # Convert camelCase to snake_case for backward compatibility
        txn = convert_camel_to_snake(txn, TRANSACTION_FIELD_MAP)
        
        # Handle dates
        txn = convert_dates_from_string(txn, ['date', 'created_at', 'recurring_next_date'])
    return transactions

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if isinstance(transaction.get('date'), str):
        transaction['date'] = datetime.fromisoformat(transaction['date'])
    if isinstance(transaction.get('created_at'), str):
        transaction['created_at'] = datetime.fromisoformat(transaction['created_at'])
    return transaction

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    transaction = await db.transactions.find_one({"id": transaction_id, "user_email": user_email}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = input.model_dump()
    update_data['date'] = update_data['date'].isoformat()
    result = await db.transactions.update_one(
        {"id": transaction_id, "user_email": user_email}, 
        {"$set": update_data}
    )
    
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if isinstance(updated.get('date'), str):
        updated['date'] = datetime.fromisoformat(updated['date'])
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted successfully"}


# ============================================================================
# API ROUTES - INVESTMENTS
# ============================================================================
@api_router.post("/investments", response_model=Investment)
async def create_investment(input: InvestmentCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    investment = Investment(**input.model_dump())
    doc = investment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_email'] = user_email
    await db.investments.insert_one(doc)
    return investment

@api_router.get("/investments", response_model=List[Investment])
async def get_investments(request: Request):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    investments = await db.investments.find(query, {"_id": 0}).to_list(1000)
    for inv in investments:
        # Convert camelCase to snake_case for backward compatibility
        inv = convert_camel_to_snake(inv, INVESTMENT_FIELD_MAP)
        
        # CRITICAL FIX: Add symbol if missing (old data compatibility)
        if 'symbol' not in inv or inv['symbol'] is None:
            inv['symbol'] = ""
        
        # Handle dates
        inv = convert_dates_from_string(inv, ['created_at', 'purchase_date'])
        
        for op in inv.get('operations', []):
            op = convert_dates_from_string(op, ['date'])
    return investments

@api_router.post("/investments/{investment_id}/operations", response_model=Investment)
async def add_investment_operation(investment_id: str, input: InvestmentOperationCreate):
    investment = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    operation = InvestmentOperation(
        date=input.date,
        type=input.type,
        quantity=input.quantity,
        price=input.price,
        fees=input.fees,
        total=(input.quantity * input.price) + input.fees,
        notes=input.notes
    )
    
    operation_dict = operation.model_dump()
    operation_dict['date'] = operation_dict['date'].isoformat()
    
    # Add operation to array
    await db.investments.update_one(
        {"id": investment_id},
        {"$push": {"operations": operation_dict}}
    )
    
    # Recalculate investment totals
    updated = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    operations = updated.get('operations', [])
    
    # Calculate totals based on operations
    buy_ops = [op for op in operations if op.get('type') == 'buy']
    sell_ops = [op for op in operations if op.get('type') == 'sell']
    
    total_bought_quantity = sum(op.get('quantity', 0) for op in buy_ops)
    total_sold_quantity = sum(op.get('quantity', 0) for op in sell_ops)
    current_quantity = total_bought_quantity - total_sold_quantity
    
    total_bought_cost = sum(op.get('total', op.get('quantity', 0) * op.get('price', 0)) for op in buy_ops)
    average_price = total_bought_cost / total_bought_quantity if total_bought_quantity > 0 else 0
    
    # Update investment with calculated values
    await db.investments.update_one(
        {"id": investment_id},
        {"$set": {
            "quantity": current_quantity,
            "average_price": average_price,
            "current_price": average_price if updated.get('current_price', 0) == 0 else updated.get('current_price')
        }}
    )
    
    # Get final updated investment
    updated = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    for op in updated.get('operations', []):
        if isinstance(op.get('date'), str):
            op['date'] = datetime.fromisoformat(op['date'])
    return updated

@api_router.put("/investments/{investment_id}", response_model=Investment)
async def update_investment(investment_id: str, input: InvestmentUpdate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    investment = await db.investments.find_one({"id": investment_id, "user_email": user_email}, {"_id": 0})
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    # Only update fields that are provided (not None)
    update_data = {k: v for k, v in input.model_dump(exclude_none=True).items() if v is not None}
    
    # Convert operations dates to ISO strings for MongoDB
    if 'operations' in update_data:
        for op in update_data['operations']:
            if isinstance(op.get('date'), datetime):
                op['date'] = op['date'].isoformat()
    
    result = await db.investments.update_one(
        {"id": investment_id, "user_email": user_email}, 
        {"$set": update_data}
    )
    
    updated = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    for op in updated.get('operations', []):
        if isinstance(op.get('date'), str):
            op['date'] = datetime.fromisoformat(op['date'])
    return updated

@api_router.put("/investments/{investment_id}/operations/{operation_index}", response_model=Investment)
async def update_investment_operation(investment_id: str, operation_index: int, input: InvestmentOperationCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    investment = await db.investments.find_one({"id": investment_id, "user_email": user_email}, {"_id": 0})
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    if operation_index < 0 or operation_index >= len(investment.get('operations', [])):
        raise HTTPException(status_code=404, detail="Operation not found")
    
    operation = InvestmentOperation(
        date=input.date,
        type=input.type,
        quantity=input.quantity,
        price=input.price,
        fees=input.fees,
        total=(input.quantity * input.price) + input.fees,
        notes=input.notes
    )
    
    operation_dict = operation.model_dump()
    operation_dict['date'] = operation_dict['date'].isoformat()
    
    # Update the specific operation
    await db.investments.update_one(
        {"id": investment_id, "user_email": user_email},
        {"$set": {f"operations.{operation_index}": operation_dict}}
    )
    
    updated = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    for op in updated.get('operations', []):
        if isinstance(op.get('date'), str):
            op['date'] = datetime.fromisoformat(op['date'])
    return updated

@api_router.delete("/investments/{investment_id}/operations/{operation_index}")
async def delete_investment_operation(investment_id: str, operation_index: int, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    investment = await db.investments.find_one({"id": investment_id, "user_email": user_email}, {"_id": 0})
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    operations = investment.get('operations', [])
    if operation_index < 0 or operation_index >= len(operations):
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Remove the operation at the specified index
    operations.pop(operation_index)
    
    await db.investments.update_one(
        {"id": investment_id, "user_email": user_email},
        {"$set": {"operations": operations}}
    )
    
    return {"message": "Operation deleted successfully"}

@api_router.delete("/investments/{investment_id}")
async def delete_investment(investment_id: str):
    result = await db.investments.delete_one({"id": investment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Investment not found")
    return {"message": "Investment deleted successfully"}


# ============================================================================
# API ROUTES - CATEGORIES
# ============================================================================
@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    category = Category(**input.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_email'] = user_email
    await db.categories.insert_one(doc)
    return category

@api_router.get("/categories", response_model=List[Category])
async def get_categories(request: Request, type: Optional[str] = None):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    if type:
        query["type"] = type
    
    categories = await db.categories.find(query, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat.get('created_at'), str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, input: CategoryCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    category = await db.categories.find_one({"id": category_id, "user_email": user_email}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = input.model_dump()
    result = await db.categories.update_one(
        {"id": category_id, "user_email": user_email}, 
        {"$set": update_data}
    )
    
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    result = await db.categories.delete_one({"id": category_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


# ============================================================================
# API ROUTES - PAYEES/LOCATIONS
# ============================================================================
@api_router.post("/payees", response_model=Payee)
async def create_payee(input: PayeeCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    payee = Payee(**input.model_dump())
    doc = payee.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_email'] = user_email
    await db.payees.insert_one(doc)
    return payee

@api_router.get("/payees", response_model=List[Payee])
async def get_payees(request: Request):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    payees = await db.payees.find(query, {"_id": 0}).to_list(1000)
    for payee in payees:
        if isinstance(payee.get('created_at'), str):
            payee['created_at'] = datetime.fromisoformat(payee['created_at'])
    return payees

@api_router.put("/payees/{payee_id}", response_model=Payee)
async def update_payee(payee_id: str, input: PayeeCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    payee = await db.payees.find_one({"id": payee_id, "user_email": user_email}, {"_id": 0})
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    update_data = input.model_dump()
    result = await db.payees.update_one(
        {"id": payee_id, "user_email": user_email}, 
        {"$set": update_data}
    )
    
    updated = await db.payees.find_one({"id": payee_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/payees/{payee_id}")
async def delete_payee(payee_id: str, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    result = await db.payees.delete_one({"id": payee_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payee not found")
    return {"message": "Payee deleted successfully"}


# ============================================================================
# API ROUTES - TASKS (EISENHOWER MATRIX)
# ============================================================================
@api_router.post("/tasks", response_model=Task)
async def create_task(input: TaskCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    task = Task(**input.model_dump())
    doc = task.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('due_date'):
        doc['due_date'] = doc['due_date'].isoformat()
    doc['user_email'] = user_email
    await db.tasks.insert_one(doc)
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(request: Request, quadrant: Optional[str] = None, completed: Optional[bool] = None):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    if quadrant:
        query["quadrant"] = quadrant
    if completed is not None:
        query["completed"] = completed
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if task.get('due_date') and isinstance(task.get('due_date'), str):
            task['due_date'] = datetime.fromisoformat(task['due_date'])
    return tasks

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, input: TaskCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    task = await db.tasks.find_one({"id": task_id, "user_email": user_email}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = input.model_dump()
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    result = await db.tasks.update_one(
        {"id": task_id, "user_email": user_email}, 
        {"$set": update_data}
    )
    
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['due_date'] = datetime.fromisoformat(updated['due_date'])
    return updated

@api_router.patch("/tasks/{task_id}/complete")
async def toggle_task_completion(task_id: str, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    task = await db.tasks.find_one({"id": task_id, "user_email": user_email}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    new_status = not task.get('completed', False)
    await db.tasks.update_one(
        {"id": task_id, "user_email": user_email},
        {"$set": {"completed": new_status}}
    )
    
    return {"message": "Task status updated", "completed": new_status}

@api_router.patch("/tasks/{task_id}/move")
async def move_task_quadrant(task_id: str, quadrant: EisenhowerQuadrant, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    task = await db.tasks.find_one({"id": task_id, "user_email": user_email}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.update_one(
        {"id": task_id, "user_email": user_email},
        {"$set": {"quadrant": quadrant}}
    )
    
    return {"message": "Task moved", "new_quadrant": quadrant}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    result = await db.tasks.delete_one({"id": task_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


# ============================================================================
# API ROUTES - USER PREFERENCES
# ============================================================================
@api_router.get("/preferences", response_model=UserPreferences)
async def get_preferences(request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    prefs = await db.preferences.find_one({"user_email": user_email}, {"_id": 0})
    if not prefs:
        # Return default preferences
        default_prefs = UserPreferences()
        doc = default_prefs.model_dump()
        doc['user_email'] = user_email
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.preferences.insert_one(doc)
        return default_prefs
    
    if isinstance(prefs.get('created_at'), str):
        prefs['created_at'] = datetime.fromisoformat(prefs['created_at'])
    if isinstance(prefs.get('updated_at'), str):
        prefs['updated_at'] = datetime.fromisoformat(prefs['updated_at'])
    return UserPreferences(**prefs)

@api_router.put("/preferences", response_model=UserPreferences)
async def update_preferences(input: UserPreferencesUpdate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    # Get existing preferences or create defaults
    prefs = await db.preferences.find_one({"user_email": user_email}, {"_id": 0})
    if not prefs:
        default_prefs = UserPreferences()
        prefs = default_prefs.model_dump()
        prefs['user_email'] = user_email
        prefs['created_at'] = datetime.now(timezone.utc).isoformat()
    
    # Update with new values
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.preferences.update_one(
        {"user_email": user_email},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.preferences.find_one({"user_email": user_email}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return UserPreferences(**updated)


# ============================================================================
# API ROUTES - GOALS
# ============================================================================
@api_router.post("/goals", response_model=Goal)
async def create_goal(input: GoalCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    goal = Goal(**input.model_dump())
    doc = goal.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('deadline'):
        doc['deadline'] = doc['deadline'].isoformat()
    doc['user_email'] = user_email
    await db.goals.insert_one(doc)
    return goal

@api_router.get("/goals", response_model=List[Goal])
async def get_goals(request: Request):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    goals = await db.goals.find(query, {"_id": 0}).to_list(1000)
    for goal in goals:
        # Convert camelCase to snake_case
        goal = convert_camel_to_snake(goal, GOAL_FIELD_MAP)
        
        # Handle dates
        goal = convert_dates_from_string(goal, ['created_at', 'deadline'])
    return goals

@api_router.put("/goals/{goal_id}", response_model=Goal)
async def update_goal(goal_id: str, input: GoalCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    update_data = input.model_dump()
    if update_data.get('deadline'):
        update_data['deadline'] = update_data['deadline'].isoformat()
    
    result = await db.goals.update_one({"id": goal_id, "user_email": user_email}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    updated = await db.goals.find_one({"id": goal_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('deadline') and isinstance(updated.get('deadline'), str):
        updated['deadline'] = datetime.fromisoformat(updated['deadline'])
    return updated

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    result = await db.goals.delete_one({"id": goal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}


# ============================================================================
# API ROUTES - DEBTS
# ============================================================================
@api_router.post("/debts", response_model=Debt)
async def create_debt(input: DebtCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    debt = Debt(**input.model_dump())
    doc = debt.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('due_date'):
        doc['due_date'] = doc['due_date'].isoformat()
    doc['user_email'] = user_email
    await db.debts.insert_one(doc)
    return debt

@api_router.get("/debts", response_model=List[Debt])
async def get_debts(request: Request):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    debts = await db.debts.find(query, {"_id": 0}).to_list(1000)
    for debt in debts:
        # Convert camelCase to snake_case
        debt = convert_camel_to_snake(debt, DEBT_FIELD_MAP)
        
        # Handle old history format to new payments format
        if 'history' in debt and not debt.get('payments'):
            debt['payments'] = []
        
        # Ensure creditor exists
        if 'creditor' not in debt:
            debt['creditor'] = 'Unknown'
        
        # Ensure amounts have defaults
        if 'total_amount' not in debt:
            debt['total_amount'] = 0
        if 'remaining_amount' not in debt:
            debt['remaining_amount'] = debt.get('total_amount', 0)
        if 'interest_rate' not in debt:
            debt['interest_rate'] = 0
        
        # Handle dates
        debt = convert_dates_from_string(debt, ['created_at', 'due_date'])
        
        # Convert dates in payments
        for payment in debt.get('payments', []):
            payment = convert_dates_from_string(payment, ['date'])
    return debts

@api_router.put("/debts/{debt_id}", response_model=Debt)
async def update_debt(debt_id: str, input: DebtCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    # Get existing debt to check for payments
    existing_debt = await db.debts.find_one({"id": debt_id, "user_email": user_email}, {"_id": 0})
    if not existing_debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    update_data = input.model_dump()
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    # Recalculate remaining_amount if total_amount changed
    payments = existing_debt.get('payments', [])
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_total = update_data.get('total_amount', existing_debt.get('total_amount', existing_debt.get('totalAmount', 0)))
    update_data['remaining_amount'] = new_total - total_paid
    # Also update camelCase field for database compatibility
    update_data['remainingAmount'] = new_total - total_paid
    
    result = await db.debts.update_one({"id": debt_id, "user_email": user_email}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    updated = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['due_date'] = datetime.fromisoformat(updated['due_date'])
    return updated

@api_router.delete("/debts/{debt_id}")
async def delete_debt(debt_id: str):
    result = await db.debts.delete_one({"id": debt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Debt not found")
    return {"message": "Debt deleted successfully"}

@api_router.post("/debts/{debt_id}/payments", response_model=Debt)
async def add_debt_payment(debt_id: str, input: DebtPaymentCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    debt = await db.debts.find_one({"id": debt_id, "user_email": user_email}, {"_id": 0})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    # Handle both camelCase (from aliases) and snake_case field names
    total_amount = debt.get('total_amount', debt.get('totalAmount', 0))
    remaining_amount = debt.get('remaining_amount', debt.get('remainingAmount', total_amount))
    
    payment = DebtPayment(
        date=input.date,
        amount=input.amount,
        notes=input.notes
    )
    
    payment_dict = payment.model_dump()
    payment_dict['date'] = payment_dict['date'].isoformat()
    
    # First add the payment
    await db.debts.update_one(
        {"id": debt_id, "user_email": user_email},
        {"$push": {"payments": payment_dict}}
    )
    
    # Then recalculate remaining amount from total payments
    updated_debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    payments = updated_debt.get('payments', [])
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_remaining = total_amount - total_paid
    
    await db.debts.update_one(
        {"id": debt_id, "user_email": user_email},
        {"$set": {"remainingAmount": new_remaining}}  # Use camelCase for database
    )
    
    # Create linked transaction if account_id exists
    if debt.get('account_id'):
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "account_id": debt['account_id'],
            "type": "expense",
            "amount": input.amount,
            "category": "Debt Payment",
            "description": f"Payment for {debt['name']}",
            "date": input.date.isoformat(),
            "user_email": user_email,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    updated = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['due_date'] = datetime.fromisoformat(updated['due_date'])
    for payment in updated.get('payments', []):
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    return updated

@api_router.put("/debts/{debt_id}/payments/{payment_index}", response_model=Debt)
async def update_debt_payment(debt_id: str, payment_index: int, input: DebtPaymentCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    debt = await db.debts.find_one({"id": debt_id, "user_email": user_email}, {"_id": 0})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    if payment_index < 0 or payment_index >= len(debt.get('payments', [])):
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment = DebtPayment(date=input.date, amount=input.amount, notes=input.notes)
    payment_dict = payment.model_dump()
    payment_dict['date'] = payment_dict['date'].isoformat()
    
    # Update the payment
    await db.debts.update_one(
        {"id": debt_id, "user_email": user_email},
        {"$set": {f"payments.{payment_index}": payment_dict}}
    )
    
    # Recalculate remaining amount
    updated_debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    total_amount = updated_debt.get('total_amount', updated_debt.get('totalAmount', 0))
    payments = updated_debt.get('payments', [])
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_remaining = total_amount - total_paid
    
    await db.debts.update_one(
        {"id": debt_id},
        {"$set": {"remainingAmount": new_remaining}}
    )
    
    # Return final updated debt
    updated = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['due_date'] = datetime.fromisoformat(updated['due_date'])
    for payment in updated.get('payments', []):
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    return updated

@api_router.delete("/debts/{debt_id}/payments/{payment_index}")
async def delete_debt_payment(debt_id: str, payment_index: int, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    debt = await db.debts.find_one({"id": debt_id, "user_email": user_email}, {"_id": 0})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    payments = debt.get('payments', [])
    if payment_index < 0 or payment_index >= len(payments):
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payments.pop(payment_index)
    
    # Recalculate remaining amount
    total_amount = debt.get('total_amount', debt.get('totalAmount', 0))
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_remaining = total_amount - total_paid
    
    await db.debts.update_one(
        {"id": debt_id, "user_email": user_email},
        {"$set": {"payments": payments, "remainingAmount": new_remaining}}
    )
    
    return {"message": "Payment deleted successfully"}


# ============================================================================
# API ROUTES - RECEIVABLES
# ============================================================================
@api_router.post("/receivables", response_model=Receivable)
async def create_receivable(input: ReceivableCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    receivable = Receivable(**input.model_dump())
    doc = receivable.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('due_date'):
        doc['due_date'] = doc['due_date'].isoformat()
    doc['user_email'] = user_email
    await db.receivables.insert_one(doc)
    return receivable

@api_router.get("/receivables", response_model=List[Receivable])
async def get_receivables(request: Request):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    receivables = await db.receivables.find(query, {"_id": 0}).to_list(1000)
    for rec in receivables:
        # Convert camelCase to snake_case
        rec = convert_camel_to_snake(rec, RECEIVABLE_FIELD_MAP)
        
        # Ensure amounts have defaults
        if 'total_amount' not in rec:
            rec['total_amount'] = 0
        if 'remaining_amount' not in rec:
            rec['remaining_amount'] = rec.get('total_amount', 0)
        
        # Handle dates
        rec = convert_dates_from_string(rec, ['created_at', 'due_date'])
        
        # Handle payments dates
        for payment in rec.get('payments', []):
            payment = convert_dates_from_string(payment, ['date'])
    return receivables

@api_router.put("/receivables/{receivable_id}", response_model=Receivable)
async def update_receivable(receivable_id: str, input: ReceivableCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    # Get existing receivable to check for payments
    existing_receivable = await db.receivables.find_one({"id": receivable_id, "user_email": user_email}, {"_id": 0})
    if not existing_receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    update_data = input.model_dump()
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    # Recalculate remaining_amount if total_amount changed
    payments = existing_receivable.get('payments', [])
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_total = update_data.get('total_amount', existing_receivable.get('total_amount', 0))
    update_data['remaining_amount'] = new_total - total_paid
    
    result = await db.receivables.update_one({"id": receivable_id, "user_email": user_email}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    updated = await db.receivables.find_one({"id": receivable_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['due_date'] = datetime.fromisoformat(updated['due_date'])
    # Handle payments dates
    for payment in updated.get('payments', []):
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    return updated

@api_router.delete("/receivables/{receivable_id}")
async def delete_receivable(receivable_id: str, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    result = await db.receivables.delete_one({"id": receivable_id, "user_email": user_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Receivable not found")
    return {"message": "Receivable deleted successfully"}

@api_router.post("/receivables/{receivable_id}/payments", response_model=Receivable)
async def add_receivable_payment(receivable_id: str, input: ReceivablePaymentCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    receivable = await db.receivables.find_one({"id": receivable_id, "user_email": user_email}, {"_id": 0})
    if not receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    # Handle both camelCase (from aliases) and snake_case field names
    total_amount = receivable.get('total_amount', receivable.get('totalAmount', 0))
    remaining_amount = receivable.get('remaining_amount', receivable.get('remainingAmount', total_amount))
    
    payment = ReceivablePayment(date=input.date, amount=input.amount, notes=input.notes)
    payment_dict = payment.model_dump()
    payment_dict['date'] = payment_dict['date'].isoformat()
    
    # First add the payment
    await db.receivables.update_one(
        {"id": receivable_id, "user_email": user_email},
        {"$push": {"payments": payment_dict}}
    )
    
    # Then recalculate remaining amount from total payments
    updated_receivable = await db.receivables.find_one({"id": receivable_id}, {"_id": 0})
    payments = updated_receivable.get('payments', [])
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_remaining = total_amount - total_paid
    
    await db.receivables.update_one(
        {"id": receivable_id, "user_email": user_email},
        {"$set": {"remaining_amount": new_remaining}}  # Use snake_case for receivables (no aliases)
    )
    
    # Create linked transaction if account_id exists
    if receivable.get('account_id'):
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "account_id": receivable['account_id'],
            "type": "income",
            "amount": input.amount,
            "category": "Receivable Payment",
            "description": f"Payment for {receivable['name']}",
            "date": input.date.isoformat(),
            "user_email": user_email,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    updated = await db.receivables.find_one({"id": receivable_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['due_date'] = datetime.fromisoformat(updated['due_date'])
    for payment in updated.get('payments', []):
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    return updated

@api_router.put("/receivables/{receivable_id}/payments/{payment_index}", response_model=Receivable)
async def update_receivable_payment(receivable_id: str, payment_index: int, input: ReceivablePaymentCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    receivable = await db.receivables.find_one({"id": receivable_id, "user_email": user_email}, {"_id": 0})
    if not receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    if payment_index < 0 or payment_index >= len(receivable.get('payments', [])):
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment = ReceivablePayment(date=input.date, amount=input.amount, notes=input.notes)
    payment_dict = payment.model_dump()
    payment_dict['date'] = payment_dict['date'].isoformat()
    
    # Update the payment
    await db.receivables.update_one(
        {"id": receivable_id, "user_email": user_email},
        {"$set": {f"payments.{payment_index}": payment_dict}}
    )
    
    # Recalculate remaining amount
    updated_receivable = await db.receivables.find_one({"id": receivable_id}, {"_id": 0})
    total_amount = updated_receivable.get('total_amount', updated_receivable.get('totalAmount', 0))
    payments = updated_receivable.get('payments', [])
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_remaining = total_amount - total_paid
    
    await db.receivables.update_one(
        {"id": receivable_id},
        {"$set": {"remaining_amount": new_remaining}}
    )
    
    # Return final updated receivable
    updated = await db.receivables.find_one({"id": receivable_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['due_date'] = datetime.fromisoformat(updated['due_date'])
    for payment in updated.get('payments', []):
        if isinstance(payment.get('date'), str):
            payment['date'] = datetime.fromisoformat(payment['date'])
    return updated

@api_router.delete("/receivables/{receivable_id}/payments/{payment_index}")
async def delete_receivable_payment(receivable_id: str, payment_index: int, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    receivable = await db.receivables.find_one({"id": receivable_id, "user_email": user_email}, {"_id": 0})
    if not receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    payments = receivable.get('payments', [])
    if payment_index < 0 or payment_index >= len(payments):
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payments.pop(payment_index)
    
    # Recalculate remaining amount
    total_amount = receivable.get('total_amount', receivable.get('totalAmount', 0))
    total_paid = sum(p.get('amount', 0) for p in payments)
    new_remaining = total_amount - total_paid
    
    await db.receivables.update_one(
        {"id": receivable_id, "user_email": user_email},
        {"$set": {"payments": payments, "remaining_amount": new_remaining}}
    )
    
    return {"message": "Payment deleted successfully"}


# ============================================================================
# API ROUTES - SHOPPING/PRODUCTS
# ============================================================================
@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    product = Product(**input.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('last_purchased_date'):
        doc['last_purchased_date'] = doc['last_purchased_date'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for prod in products:
        if isinstance(prod.get('created_at'), str):
            prod['created_at'] = datetime.fromisoformat(prod['created_at'])
        if prod.get('last_purchased_date') and isinstance(prod.get('last_purchased_date'), str):
            prod['last_purchased_date'] = datetime.fromisoformat(prod['last_purchased_date'])
    return products

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, input: ProductCreate):
    update_data = input.model_dump()
    if update_data.get('last_purchased_date'):
        update_data['last_purchased_date'] = update_data['last_purchased_date'].isoformat()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('last_purchased_date') and isinstance(updated.get('last_purchased_date'), str):
        updated['last_purchased_date'] = datetime.fromisoformat(updated['last_purchased_date'])
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.post("/products/{product_id}/purchase")
async def record_purchase(product_id: str, location: str, price: float):
    """Record a product purchase"""
    update_data = {
        "last_purchased_date": datetime.now(timezone.utc).isoformat(),
        "last_purchased_location": location,
        "current_price": price
    }
    
    result = await db.products.update_one(
        {"id": product_id},
        {
            "$set": update_data,
            "$addToSet": {"locations": location}
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Purchase recorded successfully"}


# ============================================================================
# API ROUTES - SHOPPING LISTS
# ============================================================================
@api_router.post("/shopping-lists", response_model=ShoppingList)
async def create_shopping_list(input: ShoppingListCreate):
    shopping_list = ShoppingList(**input.model_dump())
    doc = shopping_list.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.shopping_lists.insert_one(doc)
    return shopping_list

@api_router.get("/shopping-lists", response_model=List[ShoppingList])
async def get_shopping_lists():
    lists = await db.shopping_lists.find({}, {"_id": 0}).to_list(1000)
    for lst in lists:
        if isinstance(lst.get('created_at'), str):
            lst['created_at'] = datetime.fromisoformat(lst['created_at'])
    return lists

@api_router.get("/shopping-lists/{list_id}", response_model=ShoppingList)
async def get_shopping_list(list_id: str):
    shopping_list = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    if isinstance(shopping_list.get('created_at'), str):
        shopping_list['created_at'] = datetime.fromisoformat(shopping_list['created_at'])
    return shopping_list

@api_router.put("/shopping-lists/{list_id}", response_model=ShoppingList)
async def update_shopping_list(list_id: str, input: ShoppingListCreate):
    result = await db.shopping_lists.update_one(
        {"id": list_id},
        {"$set": input.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    
    updated = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/shopping-lists/{list_id}")
async def delete_shopping_list(list_id: str):
    result = await db.shopping_lists.delete_one({"id": list_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    return {"message": "Shopping list deleted successfully"}

@api_router.post("/shopping-lists/{list_id}/items")
async def add_item_to_list(list_id: str, product_id: str, quantity: int = 1, request: Request = None):
    """Add a product to shopping list"""
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    shopping_list = await db.shopping_lists.find_one({"id": list_id, "user_email": user_email}, {"_id": 0})
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already exists
    items = shopping_list.get('items', [])
    existing_item = next((item for item in items if item.get('product_id') == product_id), None)
    
    if existing_item:
        # Update quantity
        for item in items:
            if item.get('product_id') == product_id:
                item['quantity'] = item.get('quantity', 1) + quantity
    else:
        # Add new item
        items.append({
            "product_id": product_id,
            "product_name": product['name'],
            "quantity": quantity,
            "is_checked": False
        })
    
    await db.shopping_lists.update_one(
        {"id": list_id, "user_email": user_email},
        {"$set": {"items": items}}
    )
    
    return {"message": "Product added to list", "item_count": len(items)}

@api_router.delete("/shopping-lists/{list_id}/items/{product_id}")
async def remove_item_from_list(list_id: str, product_id: str, request: Request = None):
    """Remove a product from shopping list"""
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    shopping_list = await db.shopping_lists.find_one({"id": list_id, "user_email": user_email}, {"_id": 0})
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    
    items = shopping_list.get('items', [])
    items = [item for item in items if item.get('product_id') != product_id]
    
    await db.shopping_lists.update_one(
        {"id": list_id, "user_email": user_email},
        {"$set": {"items": items}}
    )
    
    return {"message": "Product removed from list", "item_count": len(items)}

@api_router.get("/shopping-lists/{list_id}/download")
async def download_shopping_list(list_id: str):
    """Generate downloadable shopping list"""
    from fastapi.responses import PlainTextResponse
    
    shopping_list = await db.shopping_lists.find_one({"id": list_id}, {"_id": 0})
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    
    # Generate text format
    text_content = f"# {shopping_list['name']}\n"
    text_content += f"Créée le: {shopping_list['created_at']}\n\n"
    
    for item in shopping_list.get('items', []):
        checkbox = "☑" if item.get('is_checked') else "☐"
        text_content += f"{checkbox} {item['product_name']} (x{item['quantity']})\n"
    
    return PlainTextResponse(
        content=text_content,
        headers={"Content-Disposition": f"attachment; filename=liste-courses-{list_id}.txt"}
    )


# ============================================================================
# API ROUTES - BANK CONNECTIONS
# ============================================================================
@api_router.post("/bank-connections", response_model=BankConnection)
async def create_bank_connection(input: BankConnectionCreate):
    connection = BankConnection(**input.model_dump())
    doc = connection.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('last_sync'):
        doc['last_sync'] = doc['last_sync'].isoformat()
    await db.bank_connections.insert_one(doc)
    return connection

@api_router.get("/bank-connections", response_model=List[BankConnection])
async def get_bank_connections():
    connections = await db.bank_connections.find({}, {"_id": 0}).to_list(1000)
    for conn in connections:
        if isinstance(conn.get('created_at'), str):
            conn['created_at'] = datetime.fromisoformat(conn['created_at'])
        if conn.get('last_sync') and isinstance(conn.get('last_sync'), str):
            conn['last_sync'] = datetime.fromisoformat(conn['last_sync'])
    return connections

@api_router.post("/bank-connections/{connection_id}/sync")
async def sync_bank_connection(connection_id: str):
    """Trigger bank sync - placeholder for actual bank API integration"""
    connection = await db.bank_connections.find_one({"id": connection_id}, {"_id": 0})
    if not connection:
        raise HTTPException(status_code=404, detail="Bank connection not found")
    
    # Update last sync time
    await db.bank_connections.update_one(
        {"id": connection_id},
        {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Bank sync initiated", "status": "success"}

@api_router.post("/bank-connections/{connection_id}/import-csv")
async def import_bank_csv(connection_id: str, csv_data: Dict[str, Any], request: Request):
    """Import transactions from CSV bank statement"""
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    connection = await db.bank_connections.find_one({"id": connection_id}, {"_id": 0})
    if not connection:
        raise HTTPException(status_code=404, detail="Bank connection not found")
    
    account_id = connection.get('account_id')
    if not account_id:
        raise HTTPException(status_code=400, detail="No account linked to this connection")
    
    # Parse CSV data (expecting list of rows)
    imported_count = 0
    transactions_data = csv_data.get('transactions', [])
    
    for row in transactions_data:
        # Create transaction from CSV row
        transaction = Transaction(
            account_id=account_id,
            type=TransactionType.expense if row.get('amount', 0) < 0 else TransactionType.income,
            amount=abs(float(row.get('amount', 0))),
            category=row.get('category', 'Divers'),
            description=row.get('description', 'Import bancaire'),
            date=datetime.fromisoformat(row.get('date', datetime.now(timezone.utc).isoformat()))
        )
        
        doc = transaction.model_dump()
        doc['user_email'] = user_email
        doc['date'] = doc['date'].isoformat()
        doc['created_at'] = doc['created_at'].isoformat()
        
        # Check if transaction already exists (avoid duplicates)
        existing = await db.transactions.find_one({
            "user_email": user_email,
            "account_id": account_id,
            "date": doc['date'],
            "amount": doc['amount'],
            "description": doc['description']
        })
        
        if not existing:
            await db.transactions.insert_one(doc)
            imported_count += 1
    
    # Update last sync
    await db.bank_connections.update_one(
        {"id": connection_id},
        {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "message": f"{imported_count} transactions imported successfully",
        "imported_count": imported_count,
        "total_rows": len(transactions_data)
    }

@api_router.delete("/bank-connections/{connection_id}")
async def delete_bank_connection(connection_id: str):
    result = await db.bank_connections.delete_one({"id": connection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bank connection not found")
    return {"message": "Bank connection deleted successfully"}


# ============================================================================
# API ROUTES - DASHBOARD & STATISTICS
# ============================================================================
@api_router.get("/dashboard/summary")
async def get_dashboard_summary(request: Request):
    """Get dashboard summary with key metrics"""
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    accounts = await db.accounts.find(query, {"_id": 0}).to_list(1000)
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    investments = await db.investments.find(query, {"_id": 0}).to_list(1000)
    goals = await db.goals.find(query, {"_id": 0}).to_list(1000)
    debts = await db.debts.find(query, {"_id": 0}).to_list(1000)
    
    # Calculate totals from ACCOUNTS
    total_balance = sum(acc.get('current_balance', 0) for acc in accounts if not acc.get('is_excluded_from_total'))
    
    # Calculate total from INVESTMENTS (quantity * current_price)
    total_investments = sum(
        inv.get('quantity', 0) * inv.get('current_price', 0) 
        for inv in investments
    )
    
    # Calculate investment cost basis and gains
    total_invested = 0
    for inv in investments:
        for op in inv.get('operations', []):
            if op.get('type') == 'buy':
                total_invested += op.get('total', 0)
            elif op.get('type') == 'sell':
                total_invested -= op.get('total', 0)
    
    investment_gains = total_investments - total_invested if total_invested > 0 else 0
    investment_gains_percent = (investment_gains / total_invested * 100) if total_invested > 0 else 0
    
    # Calculate total DEBTS
    total_debts = sum(debt.get('remaining_amount', 0) for debt in debts)
    
    # NET WORTH = Comptes + Investissements - Dettes
    net_worth = total_balance + total_investments - total_debts
    
    # Calculate monthly income and expenses
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)
    
    monthly_income = sum(
        txn.get('amount', 0) for txn in transactions 
        if txn.get('type') == 'income' and datetime.fromisoformat(txn.get('date')).replace(tzinfo=timezone.utc) > month_ago
    )
    
    monthly_expenses = sum(
        txn.get('amount', 0) for txn in transactions 
        if txn.get('type') == 'expense' and datetime.fromisoformat(txn.get('date')).replace(tzinfo=timezone.utc) > month_ago
    )
    
    # Calculate expenses by category (top 5)
    from collections import defaultdict
    category_expenses = defaultdict(float)
    for txn in transactions:
        if txn.get('type') == 'expense':
            category_expenses[txn.get('category', 'Autre')] += txn.get('amount', 0)
    
    top_categories = sorted(category_expenses.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Calculate 6-month trends
    trends = []
    for i in range(6):
        start_date = now - timedelta(days=30 * (i + 1))
        end_date = now - timedelta(days=30 * i)
        
        period_income = sum(
            txn.get('amount', 0) for txn in transactions 
            if txn.get('type') == 'income' and start_date < datetime.fromisoformat(txn.get('date')).replace(tzinfo=timezone.utc) <= end_date
        )
        
        period_expenses = sum(
            txn.get('amount', 0) for txn in transactions 
            if txn.get('type') == 'expense' and start_date < datetime.fromisoformat(txn.get('date')).replace(tzinfo=timezone.utc) <= end_date
        )
        
        trends.insert(0, {
            "month": end_date.strftime("%b %Y"),
            "income": period_income,
            "expenses": period_expenses,
            "savings": period_income - period_expenses
        })
    
    return {
        "net_worth": net_worth,
        "total_balance": total_balance,
        "total_investments": total_investments,
        "total_invested": total_invested,
        "investment_gains": investment_gains,
        "investment_gains_percent": investment_gains_percent,
        "total_debts": total_debts,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "savings_rate": (monthly_income - monthly_expenses) / monthly_income if monthly_income > 0 else 0,
        "accounts_count": len(accounts),
        "goals_count": len(goals),
        "active_investments": len(investments),
        "top_categories": [{"name": cat, "amount": amt} for cat, amt in top_categories],
        "trends": trends
    }


# ============================================================================
# API ROUTES - DATA EXPORT/IMPORT
# ============================================================================
@api_router.get("/export/all")
async def export_all_data():
    """Export all data as JSON"""
    data = {
        "accounts": await db.accounts.find({}, {"_id": 0}).to_list(10000),
        "transactions": await db.transactions.find({}, {"_id": 0}).to_list(10000),
        "investments": await db.investments.find({}, {"_id": 0}).to_list(10000),
        "goals": await db.goals.find({}, {"_id": 0}).to_list(10000),
        "debts": await db.debts.find({}, {"_id": 0}).to_list(10000),
        "receivables": await db.receivables.find({}, {"_id": 0}).to_list(10000),
        "products": await db.products.find({}, {"_id": 0}).to_list(10000),
        "shopping_lists": await db.shopping_lists.find({}, {"_id": 0}).to_list(10000),
        "bank_connections": await db.bank_connections.find({}, {"_id": 0}).to_list(10000)
    }
    return data

@api_router.post("/import/all")
async def import_all_data(data: Dict[str, Any], request: Request):
    """Import all data from JSON"""
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    collections_map = {
        "accounts": db.accounts,
        "transactions": db.transactions,
        "investments": db.investments,
        "goals": db.goals,
        "debts": db.debts,
        "receivables": db.receivables,
        "products": db.products,
        "shopping_lists": db.shopping_lists,
        "bank_connections": db.bank_connections
    }
    
    imported_counts = {}
    
    for collection_name, items in data.items():
        if collection_name in collections_map and items:
            collection = collections_map[collection_name]
            
            # CRITICAL FIX: Delete existing data for this user before importing to avoid duplicates
            await collection.delete_many({"user_email": user_email})
            
            # Add user_email to each item
            for item in items:
                item['user_email'] = user_email
            
            # Insert new data
            if items:
                await collection.insert_many(items)
            imported_counts[collection_name] = len(items)
    
    return {"message": "Data imported successfully", "imported": imported_counts}


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response, session_id: str):
    """Create session from Emergent Auth session_id"""
    try:
        # Get user data from Emergent
        user_data = await get_session_data(session_id)
        
        # Save session to database
        session_token = await save_user_session(db, user_data)
        
        # Set cookie
        set_session_cookie(response, session_token)
        
        return {
            "success": True,
            "user": {
                "email": user_data['email'],
                "name": user_data.get('name'),
                "picture": user_data.get('picture')
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@api_router.get("/auth/debug")
async def debug_auth(request: Request):
    """Debug endpoint to check authentication status"""
    user = await get_current_user(request, db)
    
    # Get cookie info
    session_cookie = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization")
    
    # Get session info if exists
    session_info = None
    if session_cookie:
        session_info = await db.sessions.find_one(
            {"session_token": session_cookie},
            {"_id": 0, "email": 1, "expires_at": 1, "created_at": 1}
        )
    
    return {
        "authenticated": user is not None,
        "user": user,
        "has_session_cookie": session_cookie is not None,
        "cookie_preview": session_cookie[:20] + "..." if session_cookie else None,
        "has_auth_header": auth_header is not None,
        "session_info": session_info,
        "origin": request.headers.get("origin"),
        "referer": request.headers.get("referer")
    }


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout current user"""
    await logout_user(request, db)
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"success": True, "message": "Logged out successfully"}


# ============================================================================
# ROOT ROUTE
# ============================================================================
@api_router.get("/search")
async def global_search(q: str, request: Request):
    """Global search across all entities"""
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    search_term = q.lower()
    results = {
        "transactions": [],
        "investments": [],
        "accounts": [],
        "goals": [],
        "products": [],
        "categories": []
    }
    
    # Search in transactions
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    results["transactions"] = [
        txn for txn in transactions 
        if search_term in txn.get('description', '').lower() or 
           search_term in txn.get('category', '').lower()
    ][:10]
    
    # Search in investments
    investments = await db.investments.find(query, {"_id": 0}).to_list(1000)
    results["investments"] = [
        inv for inv in investments 
        if search_term in inv.get('name', '').lower() or 
           search_term in inv.get('symbol', '').lower()
    ][:10]
    
    # Search in accounts
    accounts = await db.accounts.find(query, {"_id": 0}).to_list(1000)
    results["accounts"] = [
        acc for acc in accounts 
        if search_term in acc.get('name', '').lower()
    ][:10]
    
    # Search in goals
    goals = await db.goals.find(query, {"_id": 0}).to_list(1000)
    results["goals"] = [
        goal for goal in goals 
        if search_term in goal.get('name', '').lower()
    ][:10]
    
    # Search in products
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    results["products"] = [
        prod for prod in products 
        if search_term in prod.get('name', '').lower() or 
           search_term in prod.get('category', '').lower()
    ][:10]
    
    # Search in categories
    categories = await db.categories.find(query, {"_id": 0}).to_list(1000)
    results["categories"] = [
        cat for cat in categories 
        if search_term in cat.get('name', '').lower()
    ][:10]
    
    return results

@api_router.delete("/user/data/all")
async def delete_all_user_data(request: Request):
    """Delete ALL user data - use with caution!"""
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_email = user['email']
    
    # Delete from all collections
    await db.accounts.delete_many({"user_email": user_email})
    await db.transactions.delete_many({"user_email": user_email})
    await db.investments.delete_many({"user_email": user_email})
    await db.goals.delete_many({"user_email": user_email})
    await db.debts.delete_many({"user_email": user_email})
    await db.receivables.delete_many({"user_email": user_email})
    await db.categories.delete_many({"user_email": user_email})
    await db.products.delete_many({"user_email": user_email})
    await db.shopping_lists.delete_many({"user_email": user_email})
    await db.bank_connections.delete_many({"user_email": user_email})
    await db.tasks.delete_many({"user_email": user_email})
    await db.payees.delete_many({"user_email": user_email})
    await db.preferences.delete_many({"user_email": user_email})
    
    return {
        "message": "All user data deleted successfully",
        "user_email": user_email
    }

@api_router.get("/")
async def root():
    return {
        "message": "FinanceApp API v2.0",
        "status": "operational",
        "endpoints": [
            "/auth/session", "/auth/me", "/auth/logout",
            "/accounts", "/transactions", "/investments",
            "/goals", "/debts", "/receivables", "/categories",
            "/products", "/shopping-lists", "/bank-connections",
            "/dashboard/summary", "/search", "/export/all", "/import/all",
            "/user/data/all (DELETE)"
        ]
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "http://localhost:3000",
        "https://finance-fusion-2.preview.emergentagent.com",
        os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
