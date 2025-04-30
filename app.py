from flask import Flask, render_template, url_for, redirect, request, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, login_required, logout_user, current_user, LoginManager
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import InputRequired, Length, ValidationError
import os
from flask_bcrypt import Bcrypt
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'database.db')
app.config['SECRET_KEY'] = 'ubedelechesecretkey'
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(20), nullable=False)
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

    # User medications
    medications = db.relationship('Medication', backref='user_profile', lazy=True, cascade="all, delete-orphan")

class RegisterForm(FlaskForm):
    fullname = StringField('Fullname', validators=[InputRequired(), Length(
        min=4, max=20)], render_kw={'placeholder': 'Fullname'}) 
    username = StringField('Username', validators=[InputRequired(), Length(
        min=4, max=20)], render_kw={'placeholder': 'Username'})  
    
    password = PasswordField('Password', validators=[InputRequired(), Length(\
        min=8, max=20)], render_kw={'placeholder': 'Password'})

    submit = SubmitField('Register')

    def validate_username(self, username):
        existing_user = User.query.filter_by(username=username.data).first()

        # Check if the username already exists in the database, if so,
        if existing_user:
            raise ValidationError(
                "Username already exists. Please choose a different one.") 

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired(), Length(
        min=4, max=20)], render_kw={'placeholder': 'Username'})  
    
    password = PasswordField('Password', validators=[InputRequired(), Length(\
        min=8, max=20)], render_kw={'placeholder': 'Password'})

    submit = SubmitField('Login') 
        
class CareProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    care_recipient = db.Column(db.String(50), nullable=False)  # who you care for
    relationship = db.Column(db.String(50), nullable=False)    # relationship to them
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Add relationship to medications
    medications = db.relationship('Medication', backref='care_profile', lazy=True, cascade="all, delete-orphan")

# New Medication model
class Medication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(100))
    instructions = db.Column(db.String(200))
    dosage_type = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(10), nullable=False)  # Store as HH:MM
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    profile_id = db.Column(db.Integer, db.ForeignKey('care_profile.id'), nullable=False)
    
    # Relationship to medication history
    history = db.relationship('MedicationHistory', backref='medication', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'dosage': self.dosage,
            'instructions': self.instructions,
            'dosageType': self.dosage_type,
            'startDate': self.start_date.isoformat(),
            'endDate': self.end_date.isoformat(),
            'time': self.time,
            'profile_id': self.profile_id
        }

# New MedicationHistory model
class MedicationHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # 'taken' or 'skipped'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    medication_id = db.Column(db.Integer, db.ForeignKey('medication.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def to_dict(self):
        medication = Medication.query.get(self.medication_id)
        return {
            'id': self.id,
            'medicationId': self.medication_id,
            'name': medication.name,
            'dosage': medication.dosage,
            'date': self.date.isoformat(),
            'time': self.time,
            'status': self.status,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/start', methods=['GET', 'POST'])
def start():
    return render_template('start.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()

    if form.validate_on_submit():
        # checked if the user exists in the database and if the password is correct
        # if so, log the user in and redirect to the home page
        user = User.query.filter_by(username=form.username.data).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', form=form, error='Invalid username or password')
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if form.errors:
        return render_template('login.html', form=form, error=form.errors)
    return render_template('login.html', form=form)

@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        new_user = User(
            fullname=form.fullname.data, 
            username=form.username.data,
            password=hashed_password
        )
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

@app.context_processor
def utility_processor():
    return dict(get_initials=get_initials)

# route for view profile
def get_initials(name):
    parts = name.strip().split()
    initials = ''.join([p[0].upper() for p in parts if p])
    return initials

@app.route('/view_profile', methods=['GET', 'POST'])
@login_required
def view_profile():

    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()

    if request.method == 'POST':
        new_fullname = request.form.get('name')
        new_username = request.form.get('username')
        new_password = request.form.get('password')

        # Update the current user's fullname and username
        current_user.fullname = new_fullname
        current_user.username = new_username

        # Only update password if a new password was entered
        if new_password:
            hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
            current_user.password = hashed_password
        
        db.session.commit()
        return redirect(url_for('view_profile'))

    fullname = current_user.fullname
    username = current_user.username
    initials = get_initials(fullname)
    return render_template('view_profile.html', fullname=fullname, username=username, initials=initials, profiles=profiles)

# route for care profiles page
@app.route('/care_profiles', methods=['GET', 'POST'])
@login_required
def care_profiles():
    # Get existing profiles
    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()
    
    if request.method == 'POST':
        # Check if user has reached the profile limit (3)
        if len(profiles) >= 3:
            flash('You have reached the maximum number of care profiles (3). Please upgrade your subscription to add more profiles.', 'warning')
            return redirect(url_for('care_profiles'))
        
            
        care_recipient = request.form['care_recipient']
        relationship = request.form['relationship']

        new_profile = CareProfile(
            care_recipient=care_recipient,
            relationship=relationship,
            user_id=current_user.id
        )

        db.session.add(new_profile)
        db.session.commit()
        
        # Automatically set this as the active profile
        session['active_profile_id'] = new_profile.id
        return redirect(url_for('dashboard'))

    # For GET requests, show the care profiles page
    fullname = current_user.fullname
    initials = get_initials(fullname)
    return render_template('care_profiles.html', profiles=profiles, fullname=fullname, initials=initials)

@app.route('/edit_profile/<int:profile_id>', methods=['GET', 'POST'])
@login_required
def edit_profile(profile_id):
    # Get the profile to edit
    profile = CareProfile.query.filter_by(id=profile_id, user_id=current_user.id).first_or_404()
    
    # Get all profiles for the sidebar
    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()
    
    if request.method == 'POST':
        # Update the profile with new data
        profile.care_recipient = request.form.get('care_recipient')
        profile.relationship = request.form.get('relationship')
        
        db.session.commit()
        return redirect(url_for('care_profiles'))
    
    # For GET requests, show the edit form
    fullname = current_user.fullname
    initials = get_initials(fullname)
    return render_template('edit_profile.html', profile=profile, profiles=profiles, fullname=fullname, initials=initials)

@app.route('/delete_profile/<int:profile_id>', methods=['POST'])
@login_required
def delete_profile(profile_id):
    # Get the profile to delete
    profile = CareProfile.query.filter_by(id=profile_id, user_id=current_user.id).first_or_404()
    
    # If this is the active profile, clear the active profile from session
    if session.get('active_profile_id') == profile_id:
        session.pop('active_profile_id', None)
    
    # Delete the profile
    db.session.delete(profile)
    db.session.commit()
    
    return redirect(url_for('care_profiles'))

@app.route('/dashboard', methods=['GET', 'POST'])
@login_required
def dashboard():
    # Get all profiles for the sidebar
    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()
    
    # Get active profile if one is selected
    profile_id = session.get('active_profile_id')
    active_profile = None
    
    if profile_id:
        active_profile = CareProfile.query.get(profile_id)
        if active_profile and active_profile.user_id == current_user.id:
            # Using the care recipient's name for the dashboard
            fullname = current_user.fullname  # Keep user's name in the sidebar
            initials = get_initials(fullname)
            return render_template('dashboard.html', 
                                  fullname=fullname, 
                                  initials=initials, 
                                  profiles=profiles, 
                                  active_profile=active_profile)

    # fallback if no profile selected
    fullname = current_user.fullname
    initials = get_initials(fullname)
    return render_template('dashboard.html', 
                          fullname=fullname, 
                          initials=initials, 
                          profiles=profiles, 
                          active_profile=None)

#route for to do page
@app.route('/todo', methods=['GET', 'POST'])
@login_required
def todo():

    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()
    
    profile_id = session.get('active_profile_id')
    active_profile = None
    
    if profile_id:
        active_profile = CareProfile.query.get(profile_id)
    
    fullname = current_user.fullname
    initials = get_initials(fullname)
    return render_template('todo.html', fullname=fullname, initials=initials, profiles=profiles, active_profile=active_profile)

# Updated medications route to include backend data
@app.route('/medications', methods=['GET'])
@login_required
def medications():
    # Get all profiles for the sidebar
    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()
    
    # Get active profile if one is selected
    profile_id = session.get('active_profile_id')
    active_profile = None
    
    if profile_id:
        active_profile = CareProfile.query.get(profile_id)
    
    fullname = current_user.fullname
    initials = get_initials(fullname)
    return render_template('medications.html', fullname=fullname, initials=initials, profiles=profiles, active_profile=active_profile)

#route for health records page
@app.route('/health_records', methods=['GET', 'POST'])
@login_required
def health_records():
    # Get all profiles for the sidebar
    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()
    
    # Get active profile if one is selected
    profile_id = session.get('active_profile_id')
    active_profile = None
    
    if profile_id:
        active_profile = CareProfile.query.get(profile_id)
    
    fullname = current_user.fullname
    initials = get_initials(fullname)
    return render_template('health_records.html', fullname=fullname, initials=initials, profiles=profiles, active_profile=active_profile)

@app.route('/switch_profile/<int:profile_id>', methods=['POST'])
@login_required
def switch_profile(profile_id):
    selected_profile = CareProfile.query.filter_by(id=profile_id, user_id=current_user.id).first()
    if selected_profile:
        session['active_profile_id'] = profile_id
    return redirect(url_for('dashboard'))

# API Routes for Medications

# Get all medications for the current active profile
@app.route('/api/medications', methods=['GET'])
@login_required
def get_medications():
    profile_id = session.get('active_profile_id')
    
    if not profile_id:
        return jsonify({'error': 'No active profile selected'}), 400
    
    # Verify the profile belongs to the current user
    profile = CareProfile.query.filter_by(id=profile_id, user_id=current_user.id).first()
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    medications = Medication.query.filter_by(profile_id=profile_id).all()
    return jsonify({
        'medications': [med.to_dict() for med in medications]
    })

# Add a new medication
@app.route('/api/medications', methods=['POST'])
@login_required
def add_medication():
    profile_id = session.get('active_profile_id')
    
    if not profile_id:
        return jsonify({'error': 'No active profile selected'}), 400
    
    # Verify the profile belongs to the current user
    profile = CareProfile.query.filter_by(id=profile_id, user_id=current_user.id).first()
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    # Check if user has reached the medication limit (3 for free users)
    medication_count = Medication.query.filter_by(profile_id=profile_id).count()
    if medication_count >= 3:
        return jsonify({'error': 'You have reached the maximum number of medications (3). Please upgrade to premium.'}), 403
    
    data = request.json
    
    try:
        # Convert string dates to datetime objects
        start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
        
        new_medication = Medication(
            name=data['name'],
            dosage=data.get('dosage', ''),
            instructions=data.get('instructions', ''),
            dosage_type=data['dosageType'],
            start_date=start_date,
            end_date=end_date,
            time=data['time'],
            user_id=current_user.id,
            profile_id=profile_id
        )
        
        db.session.add(new_medication)
        db.session.commit()
        
        return jsonify({
            'message': 'Medication added successfully',
            'medication': new_medication.to_dict()
        })
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400

# Update an existing medication
@app.route('/api/medications/<int:medication_id>', methods=['PUT'])
@login_required
def update_medication(medication_id):
    # Find the medication and verify it belongs to the current user
    medication = Medication.query.filter_by(id=medication_id, user_id=current_user.id).first()
    
    if not medication:
        return jsonify({'error': 'Medication not found'}), 404
    
    data = request.json
    
    try:
        # Update medication fields
        if 'name' in data:
            medication.name = data['name']
        if 'dosage' in data:
            medication.dosage = data['dosage']
        if 'instructions' in data:
            medication.instructions = data['instructions']
        if 'dosageType' in data:
            medication.dosage_type = data['dosageType']
        if 'startDate' in data:
            medication.start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
        if 'endDate' in data:
            medication.end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
        if 'time' in data:
            medication.time = data['time']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Medication updated successfully',
            'medication': medication.to_dict()
        })
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400

# Delete a medication
@app.route('/api/medications/<int:medication_id>', methods=['DELETE'])
@login_required
def delete_medication(medication_id):
    # Find the medication and verify it belongs to the current user
    medication = Medication.query.filter_by(id=medication_id, user_id=current_user.id).first()
    
    if not medication:
        return jsonify({'error': 'Medication not found'}), 404
    
    db.session.delete(medication)
    db.session.commit()
    
    return jsonify({'message': 'Medication deleted successfully'})

# API Routes for Medication History

# Get medication history for the current active profile
@app.route('/api/medication-history', methods=['GET'])
@login_required
def get_medication_history():
    profile_id = session.get('active_profile_id')
    
    if not profile_id:
        return jsonify({'error': 'No active profile selected'}), 400
    
    # Get all medications for this profile
    medications = Medication.query.filter_by(profile_id=profile_id, user_id=current_user.id).all()
    medication_ids = [med.id for med in medications]
    
    # Get history for these medications
    history = MedicationHistory.query.filter(
        MedicationHistory.medication_id.in_(medication_ids),
        MedicationHistory.user_id == current_user.id
    ).order_by(MedicationHistory.date.desc(), MedicationHistory.time).all()
    
    return jsonify({
        'history': [item.to_dict() for item in history]
    })

# Add or update medication history (mark as taken or skipped)
@app.route('/api/medication-history', methods=['POST'])
@login_required
def add_medication_history():
    data = request.json
    
    try:
        medication_id = data['medicationId']
        status = data['status']
        date_str = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # Verify the medication belongs to the current user
        medication = Medication.query.filter_by(id=medication_id, user_id=current_user.id).first()
        
        if not medication:
            return jsonify({'error': 'Medication not found'}), 404
        
        # Convert string date to datetime object
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Check if there's already a history entry for this medication on this date
        existing_history = MedicationHistory.query.filter_by(
            medication_id=medication_id,
            user_id=current_user.id,
            date=date
        ).first()
        
        if existing_history:
            # Update existing history
            existing_history.status = status
            existing_history.updated_at = datetime.utcnow()
        else:
            # Create new history entry
            new_history = MedicationHistory(
                medication_id=medication_id,
                user_id=current_user.id,
                date=date,
                time=medication.time,
                status=status
            )
            db.session.add(new_history)
        
        db.session.commit()
        
        return jsonify({'message': 'Medication history updated successfully'})
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400

# Delete medication history entry
@app.route('/api/medication-history/<int:history_id>', methods=['DELETE'])
@login_required
def delete_medication_history(history_id):
    # Find the history entry and verify it belongs to the current user
    history = MedicationHistory.query.filter_by(id=history_id, user_id=current_user.id).first()
    
    if not history:
        return jsonify({'error': 'History entry not found'}), 404
    
    db.session.delete(history)
    db.session.commit()
    
    return jsonify({'message': 'History entry deleted successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
