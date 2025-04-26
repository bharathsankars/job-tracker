import React, { useState, useEffect } from "react";
import "./JobTracker.css";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const JobTracker = () => {
  const [applications, setApplications] = useState([]);
  const [formData, setFormData] = useState({
    company: "",
    title: "",
    date: "",
    status: "Applied",
    email: "",
    notes: "",
  });
  const [editIndex, setEditIndex] = useState(null);

  // Load applications from localStorage on component mount
  useEffect(() => {
    const savedApplications = localStorage.getItem("applications-v1");
    if (savedApplications) {
      setApplications(JSON.parse(savedApplications));
    }
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem("applications-v1", JSON.stringify(applications));
    }
  }, [applications]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (handleValidation()) {
      if (editIndex !== null) {
        const updatedApplications = applications.map((app, idx) =>
          idx === editIndex ? formData : app
        );
        setApplications(updatedApplications);
        toast.success("Application updated successfully!");
        setEditIndex(null);
      } else {
        setApplications((prev) => [...prev, formData]);
        toast.success("Application added successfully!");
      }
      setFormData({
        company: "",
        title: "",
        date: "",
        status: "Applied",
        email: "",
        notes: "",
      });
    }
  };

  const handleEdit = (index) => {
    setFormData(applications[index]);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      setApplications(applications.filter((_, i) => i !== index));
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("date"); // default sort by date

  const filteredAndSortedApplications = applications
    .filter(
      (app) =>
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "date") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortOption === "company") {
        return a.company.localeCompare(b.company);
      } else if (sortOption === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  const handleExportCSV = () => {
    if (filteredAndSortedApplications.length === 0) {
      alert("No applications to export!");
      return;
    }
    const headers = ["Company", "Title", "Application Date", "Status", "Email", "Notes"];
    const rows = filteredAndSortedApplications.map((app) => [
      `"${app.company}"`,
      `"${app.title}"`,
      `"${new Date(app.date).toLocaleDateString()}"`,
      `"${app.status}"`,
      `"${app.email}"`,
      `"${app.notes}"`,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "job_applications.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const headers = ["Company", "Title", "Application Date", "Status", "Email", "Notes"];
    const rows = filteredAndSortedApplications.map((app) => [
      app.company,
      app.title,
      new Date(app.date).toLocaleDateString(),
      app.status,
      app.email,
      app.notes,
    ]);

    doc.autoTable({
      head: [headers],
      body: rows,
    });

    doc.save("job_applications.pdf");
  };

  const [formErrors, setFormErrors] = useState({
    company: "",
    title: "",
    date: "",
    email: "",
    notes: "",
  });

  const handleValidation = () => {
    let errors = {};
    if (!formData.company) errors.company = "Company name is required";
    if (!formData.title) errors.title = "Job title is required";
    if (!formData.date) errors.date = "Application date is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.notes) errors.notes = "Notes are required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateRange, setFilterDateRange] = useState({ start: "", end: "" });

  const filteredApplications = applications.filter((app) => {
    const isStatusMatch = filterStatus === "All" || app.status === filterStatus;
    const isDateMatch =
      (!filterDateRange.start || new Date(app.date) >= new Date(filterDateRange.start)) &&
      (!filterDateRange.end || new Date(app.date) <= new Date(filterDateRange.end));

    return isStatusMatch && isDateMatch;
  });

  const handleDateRangeChange = (e) => {
    setFilterDateRange({
      ...filterDateRange,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="job-tracker-container">
      <div className="job-tracker-card">
        <h1 className="job-tracker-title">Job Application Tracker</h1>

        <form onSubmit={handleSubmit} className="job-tracker-form">
          {["company", "title", "date", "email"].map((field) => (
            <div className="form-group" key={field}>
              <label htmlFor={field}>
                {field === "date"
                  ? "Application Date"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === "date" ? "date" : "text"}
                id={field}
                name={field}
                value={formData[field]}
                onChange={handleChange}
              />
            </div>
          ))}

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              cols="50"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Applied">Applied</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Interview Completed">Interview Completed</option>
              <option value="Offer Received">Offer Received</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <button type="submit" className="submit-button">
            {editIndex !== null ? "Update Application" : "Add Application"}
          </button>
        </form>

        <div className="applications-list">
          <h2 className="applications-title">Applications</h2>
          {applications.length === 0 ? (
            <div> </div>
          ) : (
            <div className="button-container">
              <button title="Download applications" onClick={handleExportCSV} className="export-button">
                Export to CSV
              </button>
              {/* <button onClick={handleExportPDF} className="export-button">
                Export to PDF
              </button> */}
            </div>
          )}

          <div className="search-sort-container">
            <input
              type="text"
              placeholder="Search by company or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-dropdown"
            >
              <option value="date">Sort by Date</option>
              <option value="company">Sort by Company</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>

          {applications.length === 0 ? (
            <p className="no-applications">No applications yet.</p>
          ) : (
            <ul className="application-items">
              {filteredAndSortedApplications.map((app, index) => (
                <li key={index} className="application-item">
                  <div className="application-details">
                    <h3 className="application-company">{app.company}</h3>
                    <p>Role: {app.title}</p>
                    <p>Applied On: {new Date(app.date).toLocaleDateString()}</p>
                    <p>Status: <strong>{app.status}</strong></p>
                    <p>Email: {app.email}</p>
                    <p>Notes: {app.notes}</p>
                  </div>
                  <div className="application-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(index)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(index)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobTracker;
