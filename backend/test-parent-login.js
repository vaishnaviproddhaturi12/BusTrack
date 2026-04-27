const API_BASE_URL = 'http://localhost:5000';

async function testParentLogin() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'parent.amit.kumar@gmail.com',
        password: 'Parent@123'
      })
    });

    const data = await response.json();
    console.log('Login Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.user) {
      console.log('\nUser Object:');
      console.log('- ID:', data.user.id);
      console.log('- Name:', data.user.name);
      console.log('- Role:', data.user.role);
      console.log('- Student:', data.user.student);
      console.log('- Bus:', data.user.bus);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testParentLogin();
