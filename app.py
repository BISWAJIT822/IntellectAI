from flask import Flask, render_template, request, jsonify, session
import uuid
import re
from database import init_db, save_chat_message, get_chat_history, clear_chat_history, save_lead, get_all_leads

app = Flask(__name__)
app.secret_key = 'sai_intellect_solutions_secret_key_123!'

# Initialize database
init_db()

# FAQ and responses for Sai Intellect Solutions (SAIntellect Solutions)
RESPONSES = {
    "welcome": (
        "Hello! Welcome to **SAIntellect Solutions** (SWAPPL Intellect Sol Pvt Ltd).\n"
        "I am **IntellectAI**, your digital consulting assistant. How can I help you today?\n\n"
        "We are an award-winning, STPI-recognized IT galaxy helping businesses grow with AI-driven innovation and custom products.\n\n"
        "Here are some areas you can explore:\n"
        "1. 🌐 **Our IT Services** (type 'services')\n"
        "2. 📦 **Our Software Products** (type 'products')\n"
        "3. 📈 **Digital Transformation & Marketing** (type 'marketing')\n"
        "4. 👩‍💻 **Pratibhabatee Initiative (Women in Tech)** (type 'pratibhabatee')\n"
        "5. 📅 **Schedule a Consultation** (type 'schedule')\n"
        "6. 📍 **Company Location & Contact** (type 'contact')"
    ),
    "services": (
        "### 🌐 Our Core IT & AI Services\n"
        "We deliver cutting-edge technology solutions designed to scale your operations:\n\n"
        "#### **1. AI & SaaS Solutions**\n"
        "- **Video Analytics**: AI-driven video intelligence & real-time monitoring.\n"
        "- **Translation & Regeneration**: Multi-language translation & content restructuring.\n"
        "- **Doc Summarisation & Correction**: Intelligent parsing & NLP processing.\n"
        "- **Cloud & Cybersecurity**: Cloud security auditing, data warehouse, and infrastructure hardening.\n\n"
        "#### **2. Design & Development**\n"
        "- **Web & App Development**: Responsive web apps and cross-platform mobile apps (iOS/Android).\n"
        "- **Custom CRM & ERP**: Streamlined workflow management tools.\n"
        "- **Speed Optimisation & Hosting**: Lightning-fast web architectures and secure cloud hosting.\n"
        "- **Annual Maintenance (AMC)**: 24/7 post-deployment support and monitoring."
    ),
    "products": (
        "### 📦 Our Enterprise Software Products\n"
        "We have developed robust in-house solutions to help businesses manage operations:\n\n"
        "1. **HRlytics**: An all-in-one HR Management System for employee onboarding, payroll, recruitment pipeline, and performance tracking.\n"
        "2. **PrimeEstate**: A comprehensive real estate listing, broker management, and properties portal platform.\n"
        "3. **SupplySync**: Inventory management, distribution portals, and supply chain traceability with network optimization."
    ),
    "marketing": (
        "### 📈 Digital Transformation & Performance Marketing\n"
        "Maximize your digital footprint and customer acquisition with our data-driven growth strategies:\n\n"
        "- **PPC & Performance Marketing**: Targeted high-ROI search engine and social media ad campaigns.\n"
        "- **SMM & SMO**: Social media growth campaigns to build loyal brand communities.\n"
        "- **Advanced AI SEO & Local SEO**: Rank higher on search engines and optimize Google Business profiles.\n"
        "- **Content Marketing & Branding**: Corporate identity design (logos, wireframes) and professional copywriting."
    ),
    "pratibhabatee": (
        "### 👩‍💻 Pratibhabatee Initiative\n"
        "At SAIntellect Solutions, we are proud of our **Pratibhabatee** initiative.\n\n"
        "This program is specifically designed to support **women returning to the workforce** (often referred to as *'2nd-Act women'*). We provide specialized digital training, internships, project exposure, and career mentorship to help them transition back into the technology and corporate sectors successfully."
    ),
    "about": (
        "### 🏢 About SAIntellect Solutions\n"
        "**SAIntellect Solutions** (SWAPPL Intellect Sol Private Limited) is an ISO and NASSCOM-certified IT and digital services agency based in **Bhubaneswar, Odisha, India**, with a branch in **Singapore**.\n\n"
        "#### **Key Recognition & Leadership**\n"
        "- **Awards**: Winner of the prestigious **STPI Export Awards 2018-19** as a leading women-led start-up, and recognized by **Startup Odisha** & STPI.\n"
        "- **Directors**: Pravash Pattnaik & Swetali Pattnaik.\n"
        "- **Mission**: Enabling digital transformation through data, cloud intelligence, and AI-driven innovations."
    ),
    "contact": (
        "### 📍 Contact & Locations\n"
        "We are globally connected to serve you better:\n\n"
        "- **Head Office (Bhubaneswar)**: HIG-143, Lumbini Vihar, Chandrasekharpur, Bhubaneswar, Odisha, 751016, India\n"
        "- **Branch Office (Bhubaneswar)**: Plot no - HIG-72, Lumbini Vihar, Bhubaneswar, Odisha, 751016\n"
        "- **Branch Office (Singapore)**: 505 Choa Chu Kang Street 51 #11-181, Singapore 680505\n\n"
        "#### **Get In Touch**\n"
        "- **Support Call**: `+91-674-796-2263`\n"
        "- **Sales & WhatsApp**: `+91-707-721-1601` / `0674-356-3588`\n"
        "- **Emails**: `sales@saintellectsolutions.com` / `hr@saintellectsolutions.com`\n"
        "- **Working Hours**: Monday to Saturday, 9:30 AM - 7:00 PM (IST)\n\n"
        "If you want our consulting team to reach out to you, simply type **'schedule'**!"
    )
}

def get_ai_response(user_message, session_id):
    msg = user_message.lower().strip()
    
    # Check if we are in the middle of a lead collection flow
    lead_state = session.get(f'lead_flow_{session_id}')
    if lead_state:
        return handle_lead_flow(msg, session_id, lead_state)

    # Keyword matching
    if any(k in msg for k in ['hi', 'hello', 'hey', 'start', 'welcome', 'greet', 'menu']):
        return RESPONSES["welcome"]
    
    if any(k in msg for k in ['services', 'service', 'web dev', 'app dev', 'software', 'develop', 'website', 'programming', 'coding', 'ai & saas', 'cybersecurity']):
        return RESPONSES["services"]

    if any(k in msg for k in ['product', 'products', 'hrlytics', 'primeestate', 'supplysync', 'inventory', 'payroll', 'real estate']):
        return RESPONSES["products"]
        
    if any(k in msg for k in ['marketing', 'seo', 'ads', 'ppc', 'branding', 'social media', 'smo', 'smm', 'performance marketing']):
        return RESPONSES["marketing"]
        
    if any(k in msg for k in ['pratibhabatee', 'women', 'empowerment', '2nd-act', 'returnee', 'female']):
        return RESPONSES["pratibhabatee"]
        
    if any(k in msg for k in ['about', 'company', 'who are you', 'swappl', 'intellect', 'director', 'directors', 'pravash', 'swetali', 'award', 'awards', 'stpi', 'startup odisha']):
        return RESPONSES["about"]
        
    if any(k in msg for k in ['contact', 'location', 'address', 'email', 'phone', 'bhubaneswar', 'odisha', 'office', 'singapore', 'lumbini vihar', 'whatsapp', 'number']):
        return RESPONSES["contact"]
        
    if any(k in msg for k in ['schedule', 'consult', 'hire', 'book', 'callback', 'quote', 'appointment']):
        session[f'lead_flow_{session_id}'] = {
            'step': 'name',
            'data': {}
        }
        return (
            "### 📅 Schedule a Consultation\n"
            "I will help you set up a call with our business development team. "
            "To begin, **what is your name?**"
        )
        
    # Generic intelligent response generator
    return (
        "I'm not sure I fully understand that request. As the **SAIntellect Assistant**, I can help you with:\n\n"
        "- Information about our **IT & AI services** (type 'services')\n"
        "- Our proprietary **Software Products** like HRlytics & SupplySync (type 'products')\n"
        "- Details about our **digital transformation** & SEO marketing (type 'marketing')\n"
        "- Learning about our **Pratibhabatee** women-in-tech program (type 'pratibhabatee')\n"
        "- Setting up a **business consultation** (type 'schedule')\n"
        "- Finding our global **contact/location** details (type 'contact')\n\n"
        "Feel free to click one of the quick options or ask a specific question!"
    )

def handle_lead_flow(msg, session_id, flow):
    step = flow['step']
    data = flow['data']
    
    if step == 'name':
        data['name'] = msg.title()
        flow['step'] = 'email'
        flow['data'] = data
        session[f'lead_flow_{session_id}'] = flow
        return f"Thank you, **{data['name']}**. Now, **what is your email address?**"
        
    elif step == 'email':
        # Simple email validation
        if not re.match(r"[^@]+@[^@]+\.[^@]+", msg):
            return "That doesn't look like a valid email address. Please enter a valid email address (e.g., name@example.com):"
            
        data['email'] = msg
        flow['step'] = 'service'
        flow['data'] = data
        session[f'lead_flow_{session_id}'] = flow
        return (
            "Got it! **Which service or product are you interested in?**\n"
            "- AI & SaaS Solutions\n"
            "- Web & App Development\n"
            "- Software Product (HRlytics, SupplySync, etc.)\n"
            "- Digital Marketing & Transformation\n"
            "- Custom Software / Other"
        )
        
    elif step == 'service':
        data['service'] = msg.title()
        flow['step'] = 'message'
        flow['data'] = data
        session[f'lead_flow_{session_id}'] = flow
        return "Almost done! Please write a **brief message/description** of your project or requirements:"
        
    elif step == 'message':
        data['message'] = msg
        # Save to database
        save_lead(
            name=data['name'],
            email=data['email'],
            company="Not Specified",
            service_needed=data['service'],
            message=data['message']
        )
        # Clear flow state
        session.pop(f'lead_flow_{session_id}', None)
        
        return (
            f"### 🎉 Success!\n"
            f"Thank you, **{data['name']}**! Your request for **{data['service']}** has been recorded successfully.\n\n"
            f"Our team will email you at **{data['email']}** within 24 hours to schedule your consultation.\n\n"
            f"Can I assist you with anything else? Type 'hello' to see the main menu."
        )

@app.route('/')
def home():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    message = data.get('message', '')
    session_id = session.get('session_id')
    
    if not message:
        return jsonify({'error': 'Message is required'}), 400
        
    # Save user message
    save_chat_message(session_id, 'user', message)
    
    # Generate bot response
    response_text = get_ai_response(message, session_id)
    
    # Save bot message
    save_chat_message(session_id, 'bot', response_text)
    
    return jsonify({
        'status': 'success',
        'response': response_text
    })

@app.route('/api/history', methods=['GET'])
def history():
    session_id = session.get('session_id')
    chat_history = get_chat_history(session_id)
    return jsonify({
        'history': chat_history
    })

@app.route('/api/clear', methods=['POST'])
def clear():
    session_id = session.get('session_id')
    clear_chat_history(session_id)
    session.pop(f'lead_flow_{session_id}', None)
    return jsonify({'status': 'cleared'})

@app.route('/api/leads', methods=['GET'])
def get_leads():
    # A simple read-only endpoint for checking leads during development
    leads = get_all_leads()
    return jsonify({'leads': leads})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
