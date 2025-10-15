from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, Response, Depends
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


# ============================================================================
# MODELS - ACCOUNTS
# ============================================================================
class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = "checking"  # checking, savings, investment, cash
    currency: str = "EUR"
    initial_balance: float = 0.0
    current_balance: float = 0.0
    icon: Optional[str] = "wallet"
    color: Optional[str] = "#4f46e5"
    is_excluded_from_total: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountCreate(BaseModel):
    name: str
    type: str = "checking"
    currency: str = "EUR"
    initial_balance: float = 0.0
    icon: Optional[str] = "wallet"
    color: Optional[str] = "#4f46e5"
    is_excluded_from_total: bool = False


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
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None  # daily, weekly, monthly, yearly
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
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    splits: Optional[List[SplitItem]] = None
    tags: List[str] = []


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

class Investment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    symbol: str
    type: str = "stock"  # stock, crypto, etf, bond
    quantity: float = 0.0
    average_price: float = 0.0
    current_price: float = 0.0
    currency: str = "EUR"
    operations: List[InvestmentOperation] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvestmentCreate(BaseModel):
    name: str
    symbol: str
    type: str = "stock"
    currency: str = "EUR"

class InvestmentOperationCreate(BaseModel):
    investment_id: str
    date: datetime
    type: InvestmentOperationType
    quantity: float
    price: float
    fees: float = 0.0


# ============================================================================
# MODELS - GOALS (OBJECTIFS)
# ============================================================================
class Goal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[datetime] = None
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
class Debt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    total_amount: float
    remaining_amount: float
    interest_rate: float = 0.0
    creditor: str
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DebtCreate(BaseModel):
    name: str
    total_amount: float
    remaining_amount: float
    interest_rate: float = 0.0
    creditor: str
    due_date: Optional[datetime] = None


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    type: str = "expense"
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366f1"
    budget: Optional[float] = None


# ============================================================================
# MODELS - RECEIVABLES (CRÉANCES)
# ============================================================================
class Receivable(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    amount: float
    debtor: str
    due_date: Optional[datetime] = None
    is_paid: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReceivableCreate(BaseModel):
    name: str
    amount: float
    debtor: str
    due_date: Optional[datetime] = None
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
        if isinstance(acc.get('created_at'), str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
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


# ============================================================================
# API ROUTES - TRANSACTIONS
# ============================================================================
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    transaction = Transaction(**input.model_dump())
    doc = transaction.model_dump()
    doc['date'] = doc['date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_email'] = user_email  # Add user ownership
    await db.transactions.insert_one(doc)
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    request: Request,
    account_id: Optional[str] = None,
    type: Optional[TransactionType] = None,
    limit: int = Query(default=100, le=1000)
):
    user = await get_current_user(request, db)
    query = {"user_email": user['email']} if user else {"user_email": "anonymous"}
    
    if account_id:
        query["account_id"] = account_id
    if type:
        query["type"] = type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).limit(limit).to_list(limit)
    for txn in transactions:
        if isinstance(txn.get('date'), str):
            txn['date'] = datetime.fromisoformat(txn['date'])
        if isinstance(txn.get('created_at'), str):
            txn['created_at'] = datetime.fromisoformat(txn['created_at'])
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
        if isinstance(inv.get('created_at'), str):
            inv['created_at'] = datetime.fromisoformat(inv['created_at'])
        for op in inv.get('operations', []):
            if isinstance(op.get('date'), str):
                op['date'] = datetime.fromisoformat(op['date'])
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
        total=(input.quantity * input.price) + input.fees
    )
    
    operation_dict = operation.model_dump()
    operation_dict['date'] = operation_dict['date'].isoformat()
    
    await db.investments.update_one(
        {"id": investment_id},
        {"$push": {"operations": operation_dict}}
    )
    
    updated = await db.investments.find_one({"id": investment_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    for op in updated.get('operations', []):
        if isinstance(op.get('date'), str):
            op['date'] = datetime.fromisoformat(op['date'])
    return updated

@api_router.put("/investments/{investment_id}", response_model=Investment)
async def update_investment(investment_id: str, input: InvestmentCreate, request: Request):
    user = await get_current_user(request, db)
    user_email = user['email'] if user else 'anonymous'
    
    investment = await db.investments.find_one({"id": investment_id, "user_email": user_email}, {"_id": 0})
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    update_data = input.model_dump()
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

@api_router.delete("/investments/{investment_id}")
async def delete_investment(investment_id: str):
    result = await db.investments.delete_one({"id": investment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Investment not found")
    return {"message": "Investment deleted successfully"}


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
        if isinstance(goal.get('created_at'), str):
            goal['created_at'] = datetime.fromisoformat(goal['created_at'])
        if goal.get('deadline') and isinstance(goal.get('deadline'), str):
            goal['deadline'] = datetime.fromisoformat(goal['deadline'])
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
        if isinstance(debt.get('created_at'), str):
            debt['created_at'] = datetime.fromisoformat(debt['created_at'])
        if debt.get('due_date') and isinstance(debt.get('due_date'), str):
            debt['due_date'] = datetime.fromisoformat(debt['due_date'])
    return debts

@api_router.put("/debts/{debt_id}", response_model=Debt)
async def update_debt(debt_id: str, input: DebtCreate):
    update_data = input.model_dump()
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    result = await db.debts.update_one({"id": debt_id}, {"$set": update_data})
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


# ============================================================================
# API ROUTES - RECEIVABLES
# ============================================================================
@api_router.post("/receivables", response_model=Receivable)
async def create_receivable(input: ReceivableCreate):
    receivable = Receivable(**input.model_dump())
    doc = receivable.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('due_date'):
        doc['due_date'] = doc['due_date'].isoformat()
    await db.receivables.insert_one(doc)
    return receivable

@api_router.get("/receivables", response_model=List[Receivable])
async def get_receivables():
    receivables = await db.receivables.find({}, {"_id": 0}).to_list(1000)
    for rec in receivables:
        if isinstance(rec.get('created_at'), str):
            rec['created_at'] = datetime.fromisoformat(rec['created_at'])
        if rec.get('due_date') and isinstance(rec.get('due_date'), str):
            rec['due_date'] = datetime.fromisoformat(rec['due_date'])
    return receivables

@api_router.put("/receivables/{receivable_id}", response_model=Receivable)
async def update_receivable(receivable_id: str, input: ReceivableCreate):
    update_data = input.model_dump()
    if update_data.get('due_date'):
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    result = await db.receivables.update_one({"id": receivable_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    updated = await db.receivables.find_one({"id": receivable_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if updated.get('due_date') and isinstance(updated.get('due_date'), str):
        updated['deadline'] = datetime.fromisoformat(updated['due_date'])
    return updated

@api_router.delete("/receivables/{receivable_id}")
async def delete_receivable(receivable_id: str):
    result = await db.receivables.delete_one({"id": receivable_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Receivable not found")
    return {"message": "Receivable deleted successfully"}


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
    
    return {
        "net_worth": net_worth,
        "total_balance": total_balance,
        "total_investments": total_investments,
        "total_debts": total_debts,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "savings_rate": (monthly_income - monthly_expenses) / monthly_income if monthly_income > 0 else 0,
        "accounts_count": len(accounts),
        "goals_count": len(goals),
        "active_investments": len(investments)
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
            
            # Add user_email to each item
            for item in items:
                item['user_email'] = user_email
            
            # Insert new data (don't delete existing - just add)
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


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout current user"""
    await logout_user(request, db)
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"success": True, "message": "Logged out successfully"}


# ============================================================================
# ROOT ROUTE
# ============================================================================
@api_router.get("/")
async def root():
    return {
        "message": "FinanceApp API v1.0",
        "status": "operational",
        "endpoints": [
            "/auth/session", "/auth/me", "/auth/logout",
            "/accounts", "/transactions", "/investments",
            "/goals", "/debts", "/receivables",
            "/products", "/shopping-lists", "/bank-connections",
            "/dashboard/summary", "/export/all", "/import/all"
        ]
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
