from flask import Blueprint, request, jsonify
from app.models.transaction import Transaction
from app import db
from datetime import datetime

bp = Blueprint('api', __name__)

@bp.route('/transactions', methods=['GET'])
def get_transactions():
    try:
        transactions = Transaction.query.order_by(Transaction.date.desc()).all()
        return jsonify([t.to_dict() for t in transactions])
    except Exception as e:
        return jsonify({'message': f'Error fetching transactions: {str(e)}'}), 500

@bp.route('/transactions/<int:id>', methods=['GET'])
def get_transaction(id):
    try:
        transaction = Transaction.query.get_or_404(id)
        return jsonify(transaction.to_dict())
    except Exception as e:
        return jsonify({'message': f'Error fetching transaction: {str(e)}'}), 500

@bp.route('/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['date', 'type', 'amount', 'category', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Validate transport type if category is transport
    if data['category'] == 'transport' and 'transport_type' not in data:
        return jsonify({'message': 'Transport type is required for transport category'}), 400
    
    try:
        # Parse the date string into a datetime object
        date = datetime.fromisoformat(data['date'])
        
        transaction = Transaction(
            date=date,
            type=data['type'],
            amount=float(data['amount']),
            category=data['category'],
            description=data['description'],
            transport_type=data.get('transport_type')  # Optional field
        )
        db.session.add(transaction)
        db.session.commit()
        return jsonify(transaction.to_dict()), 201
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding transaction: {str(e)}'}), 500

@bp.route('/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    try:
        transaction = Transaction.query.get_or_404(id)
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['date', 'type', 'amount', 'category', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Validate transport type if category is transport
        if data['category'] == 'transport' and 'transport_type' not in data:
            return jsonify({'message': 'Transport type is required for transport category'}), 400
        
        # Update transaction fields
        transaction.date = datetime.fromisoformat(data['date'])
        transaction.type = data['type']
        transaction.amount = float(data['amount'])
        transaction.category = data['category']
        transaction.description = data['description']
        transaction.transport_type = data.get('transport_type')
        
        db.session.commit()
        return jsonify(transaction.to_dict())
    except ValueError as e:
        return jsonify({'message': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating transaction: {str(e)}'}), 500

@bp.route('/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    try:
        transaction = Transaction.query.get_or_404(id)
        db.session.delete(transaction)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting transaction: {str(e)}'}), 500

@bp.route('/summary', methods=['GET'])
def get_summary():
    try:
        transactions = Transaction.query.all()
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
        balance = total_income - total_expenses
        
        return jsonify({
            'total_income': total_income,
            'total_expenses': total_expenses,
            'balance': balance
        })
    except Exception as e:
        return jsonify({'message': f'Error calculating summary: {str(e)}'}), 500 