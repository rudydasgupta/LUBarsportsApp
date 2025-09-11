"use client";
import { useState } from "react";

export default function AddAdminForm({ teams }: { teams: any[] }) {
  const [selectedCoordinatorType, setSelectedCoordinatorType] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  
  // Filter teams based on coordinator type and gender
  const filteredTeams = teams.filter(team => {
    const divisionName = team.division.name.toLowerCase();
    
    // Check coordinator type
    const isPool = selectedCoordinatorType === "CPC" && divisionName.includes("pool");
    const isDarts = selectedCoordinatorType === "CDC" && divisionName.includes("darts");
    
    // Check gender
    const isOpen = selectedGender === "Open" && !divisionName.includes("women");
    const isWomens = selectedGender === "Women" && divisionName.includes("women");
    
    return (isPool || isDarts) && (isOpen || isWomens);
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { selectedCoordinatorType, selectedGender, filteredTeams });
    
    if (filteredTeams.length === 0) {
      alert('No teams found for this combination. Please check your selections.');
      return;
    }
    
    // Submit the form
    const form = e.target as HTMLFormElement;
    form.submit();
  };

  return (
    <form onSubmit={handleSubmit} action="/api/admin-management/add-admin" method="POST" className="flex flex-col gap-4">
      <input type="text" name="fullName" placeholder="Full Name" required className="border border-gray-300 rounded px-3 py-2" />
      <input type="email" name="email" placeholder="Email" required className="border border-gray-300 rounded px-3 py-2" />
      <input type="password" name="password" placeholder="Password" required className="border border-gray-300 rounded px-3 py-2" />
      
      <select 
        name="coordinatorType" 
        value={selectedCoordinatorType} 
        onChange={e => setSelectedCoordinatorType(e.target.value)} 
        required 
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Select Coordinator Type</option>
        <option value="CPC">College Pool Coordinator (CPC)</option>
        <option value="CDC">College Darts Coordinator (CDC)</option>
      </select>
      
      <select 
        name="gender" 
        value={selectedGender} 
        onChange={e => setSelectedGender(e.target.value)} 
        required 
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Select League</option>
        <option value="Open">Open&apos;s</option>
        <option value="Women">Women&apos;s+</option>
      </select>
      
      <div className="text-sm text-gray-600">
        {filteredTeams.length > 0 && (
          <div>
            <strong>Available teams:</strong>
            <ul className="list-disc list-inside mt-1">
              {filteredTeams.map(team => (
                <li key={team.id}>{team.name} - {team.division.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <button 
        type="submit" 
        className="bg-[color:var(--lu-red)] text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-red-800 transition" 
        disabled={filteredTeams.length === 0}
      >
        Add Admin
      </button>
      
      {filteredTeams.length === 0 && selectedCoordinatorType && selectedGender && (
        <div className="text-red-600 text-sm text-center">No teams found for this coordinator type and gender combination.</div>
      )}
    </form>
  );
}
