from flask import Blueprint, render_template
from app.models.transaction import Transaction
from app import db

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/transactions')
def transactions():
    return render_template('transactions.html') 