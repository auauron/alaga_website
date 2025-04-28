from flask import Flask, render_template, url_for, redirect
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
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

class RegisterForm(FlaskForm):
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
        
@app.route('/')
def home():
    return render_template('home.html')

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

@app.route('/dashboard', methods=['GET', 'POST'])
@login_required
def dashboard():
    if current_user.is_authenticated:
        return render_template('dashboard.html', name=current_user.username)
    else:
        return redirect(url_for('login'))

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
        new_user = User(username=form.username.data, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

# route for view profile
@app.route('/viewprofile')
def view_profile():
    return render_template('view_profile.html')


@app.route('/start', methods=['GET', 'POST'])
def start():
    return render_template('start.html')

#route for to do page
@app.route('/todo', methods=['GET', 'POST'])
def todo():
    return render_template('todo.html')

# route for care profiles page
@app.route('/care_profiles', methods=['GET', 'POST'])
def care_profiles():
    return render_template('care_profiles.html')

#route for medications page
@app.route('/medications')
def medications():
    return render_template('medications.html')

#route for health records page
@app.route('/health_records')
def health_records():
    return render_template('health_records.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)