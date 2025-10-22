"use client";
import { useState } from "react";

export default function AddAdminForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      const form = e.target as HTMLFormElement;
      
      // Get form data
      const fullName = (form.querySelector('input[name="fullName"]') as HTMLInputElement)?.value;
      const email = (form.querySelector('input[name="email"]') as HTMLInputElement)?.value;
      const password = (form.querySelector('input[name="password"]') as HTMLInputElement)?.value;
      
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('password', password);
      
      const response = await fetch('/api/admin-management/add-admin', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // Redirect to admin management page on success
        window.location.href = '/admin-management';
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to add admin'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} action="/api/admin-management/add-admin" method="POST" className="flex flex-col gap-4">
      <input type="text" name="fullName" placeholder="Full Name" required className="border border-gray-300 rounded px-3 py-2" />
      <input type="email" name="email" placeholder="Email" required className="border border-gray-300 rounded px-3 py-2" />
      <input type="password" name="password" placeholder="Password" required className="border border-gray-300 rounded px-3 py-2" />
      
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
        <strong>Note:</strong> This will create a general admin user who can access all leagues and manage the system.
      </div>
      
      <button 
        type="submit" 
        className="bg-[color:var(--lu-red)] text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding Admin...' : 'Add Admin'}
      </button>
    </form>
  );
}
