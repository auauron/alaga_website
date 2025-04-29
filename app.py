from flask import Flask, render_template, url_for, redirect, request, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, login_required, logout_user, current_user, LoginManager
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import InputRequired, Length, ValidationError
import os
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'database.db')
app.config['SECRET_KEY'] = 'mysecretkey'
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

    user = db.relationship('User', backref='profiles')

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

# route for view profile
def get_initials(name):
    parts = name.strip().split()
    initials = ''.join([p[0].upper() for p in parts if p])
    return initials

@app.context_processor
def utility_processor():
    return dict(get_initials=get_initials)

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
    
    profiles = CareProfile.query.filter_by(user_id=current_user.id).all()
    
    if request.method == 'POST':
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

#route for medications page
@app.route('/medications', methods=['GET', 'POST'])
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)