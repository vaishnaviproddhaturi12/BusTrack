import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../apiConfig';
import './AdminParents.css';

const AdminParents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    resetPassword: false
  });
  const [createdCredential, setCreatedCredential] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        setStudents(data.students || []);
        if (!selectedStudentId && data.students?.length) {
          setSelectedStudentId(data.students[0].id);
        }
      } else {
        setError(data.message || 'Unable to load students');
      }
    } catch (err) {
      setError('Network error while loading students');
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStudents();
    }
  }, [fetchStudents, user]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    setCreatedCredential(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/parents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          resetPassword: formData.resetPassword
        })
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCreatedCredential(data.parent);
        setFormData({
          name: '',
          email: '',
          password: '',
          resetPassword: false
        });
        fetchStudents();
      } else {
        setError(data.message || 'Unable to save parent account');
      }
    } catch (err) {
      setError('Network error while saving parent account');
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find((student) => student.id === selectedStudentId);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container my-5">
        <h2>Parent Logins</h2>
        <p className="text-muted">Please log in as admin to create parent credentials.</p>
      </div>
    );
  }

  return (
    <div className="admin-parents-page py-5">
      <div className="container">
        <div className="admin-parents-layout">
          <section className="parent-form-panel">
            <h2>Parent Login Credentials</h2>
            <p className="text-muted">Create or reset a parent login for a student.</p>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {createdCredential?.password && (
              <div className="credential-result">
                <h4>Give this password to the parent</h4>
                <p><strong>Parent:</strong> {createdCredential.name}</p>
                <p><strong>Email:</strong> {createdCredential.email}</p>
                <p><strong>Password:</strong> <span>{createdCredential.password}</span></p>
                <p><strong>Student:</strong> {createdCredential.student.name}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="studentId">Student</label>
                <select
                  id="studentId"
                  name="studentId"
                  className="form-control"
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  required
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="student-summary">
                  <p><strong>Bus:</strong> {selectedStudent.bus?.busNumber || 'Not assigned'}</p>
                  <p><strong>Route:</strong> {selectedStudent.bus?.route || 'N/A'}</p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">Parent Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Parent Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="text"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to auto-generate"
                />
              </div>

              <label className="parent-reset-toggle">
                <input
                  name="resetPassword"
                  type="checkbox"
                  checked={formData.resetPassword}
                  onChange={handleChange}
                />
                Reset password if this parent already exists
              </label>

              <button className="btn btn-primary" type="submit" disabled={saving || loading || !students.length}>
                {saving ? 'Saving...' : 'Create Parent Login'}
              </button>
            </form>
          </section>

          <section className="students-panel">
            <h3>Students and Parent Accounts</h3>
            {loading ? (
              <p>Loading...</p>
            ) : students.length === 0 ? (
              <p className="text-muted">No students found.</p>
            ) : (
              <div className="student-list">
                {students.map((student) => (
                  <div className="student-row" key={student.id}>
                    <div>
                      <h4>{student.name}</h4>
                      <p>{student.email}</p>
                      <p>{student.bus?.busNumber || 'No bus assigned'}</p>
                    </div>
                    <div>
                      {student.parents.length ? (
                        student.parents.map((parent) => (
                          <span className="parent-chip" key={parent.id}>{parent.email}</span>
                        ))
                      ) : (
                        <span className="text-muted">No parent login</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminParents;
