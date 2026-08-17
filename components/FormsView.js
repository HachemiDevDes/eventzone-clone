/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import { 
  FileText, Plus, Search, Filter, Sparkles, Check, 
  Trash2, Copy, ExternalLink, Eye, Settings, Share2, 
  Download, ChevronDown, ChevronUp, ArrowLeft, BarChart2, 
  ListChecks, MessageSquare, HelpCircle, Send, Smartphone, 
  Monitor, Star, ToggleLeft, ToggleRight, CheckSquare, 
  Radio, Calendar, Hash, Type, AlignLeft, Mail, Phone,
  QrCode, Award, UserCheck, AlertCircle, X, Layers, RefreshCw
} from "lucide-react";
import QRCode from "qrcode";

// Available field types in the toolbox
const FIELD_TYPES = [
  { type: "text", label: "Short Text", icon: Type, description: "Single line input for names, titles, URLs", category: "Standard" },
  { type: "textarea", label: "Paragraph", icon: AlignLeft, description: "Multi-line text for feedback and notes", category: "Standard" },
  { type: "select", label: "Dropdown Menu", icon: ChevronDown, description: "Single option from a dropdown list", category: "Choices" },
  { type: "radio", label: "Single Choice", icon: Radio, description: "Radio buttons where one option is selected", category: "Choices" },
  { type: "checkbox", label: "Checkboxes", icon: CheckSquare, description: "Multi-select list of checkboxes", category: "Choices" },
  { type: "rating", label: "5-Star Rating", icon: Star, description: "Interactive 1 to 5 star rating for reviews", category: "Feedback" },
  { type: "nps", label: "NPS Scale (0-10)", icon: BarChart2, description: "Net Promoter Score recommendation scale", category: "Feedback" },
  { type: "number", label: "Number", icon: Hash, description: "Numeric values, age, quantities", category: "Standard" },
  { type: "email", label: "Email Address", icon: Mail, description: "Validated email input", category: "Standard" },
  { type: "date", label: "Date Picker", icon: Calendar, description: "Calendar date selection", category: "Standard" },
  { type: "switch", label: "Yes / No Toggle", icon: ToggleRight, description: "Boolean switch for consent or opt-in", category: "Choices" },
  { type: "section", label: "Section Header", icon: Layers, description: "Section title and description divider", category: "Layout" },
];

const PRESET_TEMPLATES = [
  {
    id: "tpl_ticket_reg",
    title: "Attendee Badge & Ticket Intake",
    description: "Standard attendee onboarding with dietary restrictions, job role, t-shirt size, and networking consent.",
    type: "ticket_registration",
    category: "Ticket Registration",
    fields: [
      { id: "f_job", type: "text", label: "Job Title / Role", placeholder: "e.g. Chief Legal Officer", required: true, options: [] },
      { id: "f_comp", type: "text", label: "Organization / Company", placeholder: "e.g. Energy Partners Ltd.", required: true, options: [] },
      { id: "f_track", type: "select", label: "Primary Interest Track", required: true, options: ["Green Hydrogen Infrastructure", "Energy Law & Policy", "Project Financing & Bilateral Offtake", "Port Logistics"] },
      { id: "f_diet", type: "radio", label: "Dietary Preferences", required: false, options: ["Standard (Halal)", "Vegetarian / Vegan", "Gluten-Free", "No Restrictions"] },
      { id: "f_tshirt", type: "select", label: "T-Shirt Size", required: false, options: ["Small (S)", "Medium (M)", "Large (L)", "XL", "2XL"] },
      { id: "f_network", type: "switch", label: "Include in Attendee Networking Directory", required: false, defaultValue: true, options: [] }
    ]
  },
  {
    id: "tpl_post_event_csat",
    title: "Post-Event CSAT & Experience Survey",
    description: "Comprehensive satisfaction evaluation with 5-star ratings, NPS calculation, and open feedback.",
    type: "feedback_survey",
    category: "Feedback & Survey",
    fields: [
      { id: "f_overall", type: "rating", label: "Overall Event Experience", helpText: "1 = Poor, 5 = Outstanding", maxRating: 5, required: true, options: [] },
      { id: "f_content", type: "rating", label: "Keynotes & Content Quality", helpText: "Relevance, depth, and presentation value", maxRating: 5, required: true, options: [] },
      { id: "f_venue", type: "rating", label: "Venue Facilities & Organization", helpText: "Logistics, check-in flow, and catering", maxRating: 5, required: false, options: [] },
      { id: "f_nps", type: "nps", label: "How likely are you to recommend this summit to a colleague?", helpText: "0 (Not likely) to 10 (Extremely likely)", required: true, options: [] },
      { id: "f_highlight", type: "textarea", label: "What was your main highlight or key takeaway?", placeholder: "Tell us what inspired you most...", required: false, options: [] },
      { id: "f_suggestions", type: "textarea", label: "How can we improve future editions?", placeholder: "Your honest suggestions...", required: false, options: [] }
    ]
  },
  {
    id: "tpl_speaker_eval",
    title: "Speaker & Session Rating Form",
    description: "Targeted evaluation form for individual breakout sessions and keynote presentations.",
    type: "session_survey",
    category: "Session Reviews",
    fields: [
      { id: "f_spk_rating", type: "rating", label: "Speaker Presentation Score", maxRating: 5, required: true, options: [] },
      { id: "f_topic_depth", type: "select", label: "Technical Depth of the Talk", required: true, options: ["Too Introductory", "Just Right / Balanced", "Very Advanced"] },
      { id: "f_takeaways", type: "textarea", label: "Key Learnings & Notes", placeholder: "What will you apply in your work?", required: false, options: [] },
      { id: "f_qa_questions", type: "textarea", label: "Follow-up Questions for the Speaker", placeholder: "Questions to forward to the presenter...", required: false, options: [] }
    ]
  },
  {
    id: "tpl_call_for_papers",
    title: "Call for Papers & Speaker Application",
    description: "Collect talk proposals, speaker bios, and abstracts for your conference agenda committee.",
    type: "general_inquiry",
    category: "Call for Speakers",
    fields: [
      { id: "f_spk_name", type: "text", label: "Presenter Full Name", placeholder: "Dr. Full Name", required: true, options: [] },
      { id: "f_spk_email", type: "email", label: "Contact Email Address", placeholder: "speaker@domain.com", required: true, options: [] },
      { id: "f_talk_title", type: "text", label: "Proposed Presentation Title", placeholder: "Clear, engaging talk title...", required: true, options: [] },
      { id: "f_abstract", type: "textarea", label: "Abstract / Synopsis (250-500 words)", placeholder: "Overview of findings and audience value...", required: true, options: [] },
      { id: "f_bio", type: "textarea", label: "Speaker Biography & Previous Talks", placeholder: "Brief bio and video/presentation links...", required: true, options: [] }
    ]
  },
  {
    id: "tpl_sponsor_inquiry",
    title: "Sponsor & Exhibitor Inquiry Form",
    description: "Lead capture for companies interested in sponsoring booths, lunches, and brand placements.",
    type: "general_inquiry",
    category: "Sponsorship",
    fields: [
      { id: "f_sp_company", type: "text", label: "Company / Brand Name", required: true, options: [] },
      { id: "f_sp_contact", type: "text", label: "Contact Person & Title", required: true, options: [] },
      { id: "f_sp_email", type: "email", label: "Work Email", required: true, options: [] },
      { id: "f_sp_tier", type: "select", label: "Target Sponsorship Tier", required: true, options: ["Platinum Title Partner ($25,000)", "Gold Track Sponsor ($15,000)", "Silver Booth Exhibitor ($7,500)", "Networking Reception Sponsor ($5,000)"] },
      { id: "f_sp_goals", type: "checkbox", label: "Main Objectives", required: false, options: ["Brand Visibility & PR", "Direct B2B Lead Generation", "Executive Networking", "Talent Recruitment"] }
    ]
  }
];

export default function FormsView({
  forms = [],
  submissions = [],
  tickets = [],
  onSaveForm,
  onDeleteForm,
  onSubmitResponse,
  activeEventTitle = "Eventzone Conference"
}) {
  // Mode: "hub" (list) | "builder" (edit/create) | "responses" (view submissions)
  const [viewMode, setViewMode] = useState("hub");
  const [activeFormId, setActiveFormId] = useState(null);

  // Filters in Hub
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Template Modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Share / QR Modal
  const [shareModalForm, setShareModalForm] = useState(null);
  const [shareQrUrl, setShareQrUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Active form being edited in Builder
  const [editingForm, setEditingForm] = useState(null);
  const [builderTab, setBuilderTab] = useState("fields"); // "fields" | "settings" | "preview" | "submissions"
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "mobile"
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  // Selected Submission Detail Modal
  const [inspectSubmission, setInspectSubmission] = useState(null);

  // Submissions for active form
  const activeSubmissions = useMemo(() => {
    if (!activeFormId) return [];
    return submissions.filter(s => s.formId === activeFormId);
  }, [activeFormId, submissions]);

  // Global KPIs across all forms
  const stats = useMemo(() => {
    const total = forms.length;
    const activeCount = forms.filter(f => f.status === "active").length;
    const ticketForms = forms.filter(f => f.type === "ticket_registration").length;
    const feedbackForms = forms.filter(f => f.type === "feedback_survey" || f.type === "session_survey").length;
    const totalSubs = submissions.length;

    // Calculate average rating across all feedback forms
    const ratingValues = [];
    submissions.forEach(sub => {
      if (sub.answers) {
        Object.values(sub.answers).forEach(val => {
          if (typeof val === "number" && val >= 1 && val <= 5) {
            ratingValues.push(val);
          }
        });
      }
    });

    const avgRating = ratingValues.length > 0
      ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
      : "4.8";

    return { total, activeCount, ticketForms, feedbackForms, totalSubs, avgRating, totalRatings: ratingValues.length };
  }, [forms, submissions]);

  // Filtered forms in Hub
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      const matchesSearch = (form.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (form.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCat = true;
      if (selectedCategory === "Ticket Registration") matchesCat = form.type === "ticket_registration";
      else if (selectedCategory === "Feedback & Survey") matchesCat = form.type === "feedback_survey" || form.type === "session_survey";
      else if (selectedCategory === "Inquiries & Proposals") matchesCat = form.type === "general_inquiry";

      let matchesStatus = true;
      if (selectedStatus !== "All") matchesStatus = form.status === selectedStatus.toLowerCase();

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [forms, searchQuery, selectedCategory, selectedStatus]);

  // Handle Opening Builder with Blank or Existing Form
  const handleOpenCreateBlank = () => {
    const newForm = {
      id: `form-${Date.now()}`,
      title: "New Custom Form",
      description: "Enter instructions or context for this form...",
      type: "ticket_registration",
      ticketId: "all",
      status: "active",
      settings: {
        submitButtonText: "Submit",
        successMessage: "Thank you! Your response has been recorded.",
        allowAnonymous: false,
        accentColor: "blue"
      },
      fields: [
        {
          id: `field_${Date.now()}_1`,
          type: "text",
          label: "Your Full Name",
          placeholder: "Enter full name...",
          required: true,
          options: []
        },
        {
          id: `field_${Date.now()}_2`,
          type: "email",
          label: "Email Address",
          placeholder: "name@company.com",
          required: true,
          options: []
        }
      ]
    };
    setEditingForm(newForm);
    setActiveFormId(newForm.id);
    setViewMode("builder");
    setBuilderTab("fields");
  };

  const handleOpenTemplate = (template) => {
    const newForm = {
      id: `form-${Date.now()}`,
      title: template.title,
      description: template.description,
      type: template.type,
      ticketId: "all",
      status: "active",
      settings: {
        submitButtonText: template.type === "ticket_registration" ? "Complete Registration" : "Submit Feedback",
        successMessage: "Thank you! Your submission has been saved.",
        allowAnonymous: template.type === "feedback_survey",
        accentColor: template.type === "ticket_registration" ? "blue" : "indigo"
      },
      fields: template.fields.map((f, idx) => ({
        ...f,
        id: `f_${Date.now()}_${idx}`
      }))
    };
    setEditingForm(newForm);
    setActiveFormId(newForm.id);
    setTemplateModalOpen(false);
    setViewMode("builder");
    setBuilderTab("fields");
  };

  const handleEditForm = (form) => {
    setEditingForm(JSON.parse(JSON.stringify(form)));
    setActiveFormId(form.id);
    setViewMode("builder");
    setBuilderTab("fields");
  };

  const handleViewResponses = (form) => {
    setEditingForm(JSON.parse(JSON.stringify(form)));
    setActiveFormId(form.id);
    setViewMode("builder");
    setBuilderTab("submissions");
  };

  const handleDuplicateForm = (form) => {
    const cloned = {
      ...JSON.parse(JSON.stringify(form)),
      id: `form-${Date.now()}`,
      title: `${form.title} (Copy)`,
      createdAt: new Date().toISOString()
    };
    if (onSaveForm) onSaveForm(cloned);
  };

  const handleSaveCurrentForm = () => {
    if (!editingForm) return;
    if (onSaveForm) onSaveForm(editingForm);
  };

  // Field Editor Operations
  const handleAddField = (type) => {
    if (!editingForm) return;
    const typeDef = FIELD_TYPES.find(t => t.type === type) || FIELD_TYPES[0];
    const newField = {
      id: `field_${Date.now()}`,
      type: type,
      label: type === "section" ? "Section Title" : `New ${typeDef.label}`,
      placeholder: type === "text" ? "Type answer here..." : "",
      helpText: "",
      required: type !== "section",
      options: ["select", "radio", "checkbox"].includes(type) 
        ? ["Option 1", "Option 2", "Option 3"] 
        : [],
      maxRating: type === "rating" ? 5 : undefined,
      defaultValue: type === "switch" ? false : undefined
    };

    setEditingForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
  };

  const handleUpdateField = (fieldId, updates) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  const handleDeleteField = (fieldId) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(f => f.id !== fieldId)
    }));
  };

  const handleMoveField = (index, direction) => {
    if (!editingForm) return;
    const fields = [...(editingForm.fields || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;
    setEditingForm(prev => ({ ...prev, fields }));
  };

  const handleAddOption = (fieldId) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => {
        if (f.id !== fieldId) return f;
        const currentOpts = f.options || [];
        return {
          ...f,
          options: [...currentOpts, `Option ${currentOpts.length + 1}`]
        };
      })
    }));
  };

  const handleUpdateOption = (fieldId, optIndex, value) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => {
        if (f.id !== fieldId) return f;
        const newOpts = [...(f.options || [])];
        newOpts[optIndex] = value;
        return { ...f, options: newOpts };
      })
    }));
  };

  const handleDeleteOption = (fieldId, optIndex) => {
    setEditingForm(prev => ({
      ...prev,
      fields: (prev.fields || []).map(f => {
        if (f.id !== fieldId) return f;
        const newOpts = (f.options || []).filter((_, i) => i !== optIndex);
        return { ...f, options: newOpts };
      })
    }));
  };

  // Open Share Modal & generate QR
  const handleOpenShare = async (form) => {
    setShareModalForm(form);
    setCopiedLink(false);
    try {
      const shareData = JSON.stringify({
        event: activeEventTitle,
        formId: form.id,
        formTitle: form.title,
        type: form.type,
        url: typeof window !== "undefined" ? `${window.location.origin}/?formId=${form.id}` : ""
      });
      const url = await QRCode.toDataURL(shareData, { width: 240, margin: 1, color: { dark: "#0b5cdb", light: "#ffffff" } });
      setShareQrUrl(url);
    } catch (e) {
      console.warn("QR generation error:", e);
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined" && shareModalForm) {
      const shareUrl = `${window.location.origin}/?formId=${shareModalForm.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Export Submissions to CSV
  const handleExportCSV = () => {
    if (!editingForm || activeSubmissions.length === 0) {
      alert("No submissions available to export yet.");
      return;
    }

    const headers = ["Submission ID", "Submitted At", "Respondent Name", "Respondent Email", "Ticket Tier"];
    (editingForm.fields || []).forEach(f => {
      if (f.type !== "section") headers.push(`"${f.label.replace(/"/g, '""')}"`);
    });

    const rows = activeSubmissions.map(sub => {
      const rowData = [
        sub.id,
        new Date(sub.createdAt).toLocaleString(),
        `"${(sub.respondentName || '').replace(/"/g, '""')}"`,
        `"${(sub.respondentEmail || '').replace(/"/g, '""')}"`,
        `"${(sub.ticketTier || '').replace(/"/g, '""')}"`
      ];

      (editingForm.fields || []).forEach(f => {
        if (f.type !== "section") {
          const val = sub.answers ? sub.answers[f.id] : "";
          let formattedVal = "";
          if (Array.isArray(val)) formattedVal = val.join("; ");
          else if (typeof val === "boolean") formattedVal = val ? "Yes" : "No";
          else formattedVal = val !== undefined && val !== null ? String(val) : "";
          rowData.push(`"${formattedVal.replace(/"/g, '""')}"`);
        }
      });

      return rowData.join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${editingForm.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Test Form Submission in Preview
  const handlePreviewSubmit = (e) => {
    e.preventDefault();
    setPreviewSubmitted(true);
    if (onSubmitResponse && editingForm) {
      onSubmitResponse({
        formId: editingForm.id,
        respondentName: "Preview Test User",
        respondentEmail: "test@eventzone.io",
        ticketTier: editingForm.ticketId === "all" ? "Standard Admission" : editingForm.ticketId,
        answers: previewAnswers
      });
    }
  };

  // =========================================================================
  // VIEW MODE: BUILDER (Visual Drag & Drop, Settings, Preview, Analytics)
  // =========================================================================
  if (viewMode === "builder" && editingForm) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16 animate-fade-in">
        {/* Top Sticky Header */}
        <header className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-4 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleSaveCurrentForm();
                setViewMode("hub");
              }}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span>Back to Forms</span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingForm.title}
                  onChange={(e) => setEditingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-extrabold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-0.5 outline-none transition-all"
                />
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  editingForm.type === "ticket_registration" ? "bg-emerald-100 text-emerald-700" :
                  editingForm.type === "feedback_survey" ? "bg-violet-100 text-violet-700" :
                  editingForm.type === "session_survey" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {editingForm.type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium px-2">
                {editingForm.fields?.length || 0} Questions · {activeSubmissions.length} Submissions Received
              </p>
            </div>
          </div>

          {/* Builder Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setBuilderTab("fields")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                builderTab === "fields" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListChecks size={14} />
              <span>Questions Builder</span>
            </button>

            <button
              onClick={() => setBuilderTab("settings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                builderTab === "settings" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings size={14} />
              <span>Form Settings</span>
            </button>

            <button
              onClick={() => {
                setBuilderTab("preview");
                setPreviewSubmitted(false);
                setPreviewAnswers({});
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                builderTab === "preview" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye size={14} />
              <span>Live Simulator</span>
            </button>

            <button
              onClick={() => setBuilderTab("submissions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                builderTab === "submissions" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart2 size={14} />
              <span>Responses ({activeSubmissions.length})</span>
            </button>
          </div>

          {/* Save & Share Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenShare(editingForm)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Share / QR Code"
            >
              <Share2 size={14} />
              <span>Share & QR</span>
            </button>

            <button
              onClick={() => {
                handleSaveCurrentForm();
                alert("Form changes saved successfully!");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Save Form</span>
            </button>
          </div>
        </header>

        {/* =================================================================== */}
        {/* SUB-TAB 1: QUESTIONS BUILDER (Toolbox + Canvas)                      */}
        {/* =================================================================== */}
        {builderTab === "fields" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Toolbox to Add Fields */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-5 sticky top-28">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  <span>Question Elements</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click any element to append it to your form.
                </p>
              </div>

              {/* Grouped Field Types */}
              {["Standard", "Choices", "Feedback", "Layout"].map(cat => (
                <div key={cat} className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    {cat} Elements
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {FIELD_TYPES.filter(t => t.category === cat).map(ft => {
                      const IconComp = ft.icon;
                      return (
                        <button
                          key={ft.type}
                          onClick={() => handleAddField(ft.type)}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 text-left transition-all group cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <IconComp size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {ft.label}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {ft.description}
                            </div>
                          </div>
                          <Plus size={14} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Questions Canvas */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Form Overview Banner Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                    {editingForm.type === "ticket_registration" ? "🎟️ Ticket Registration Form" : "⭐ Attendee Survey & Feedback"}
                  </span>
                  <span className="text-xs font-medium text-blue-100">
                    Linked: {editingForm.ticketId === "all" ? "All Ticket Tiers" : editingForm.ticketId}
                  </span>
                </div>
                <textarea
                  value={editingForm.description}
                  onChange={(e) => setEditingForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Form description / introduction text for respondents..."
                  rows={2}
                  className="text-xs text-blue-50 bg-white/10 hover:bg-white/15 focus:bg-white/20 rounded-xl p-2.5 border border-white/10 outline-none placeholder:text-blue-200/60 font-medium transition-all"
                />
              </div>

              {/* Questions List */}
              {(editingForm.fields || []).length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No questions added yet</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Select elements from the toolbox on the left to start building your questions and feedback prompts.
                    </p>
                  </div>
                </div>
              ) : (
                editingForm.fields.map((field, index) => {
                  const typeDef = FIELD_TYPES.find(t => t.type === field.type) || FIELD_TYPES[0];
                  const IconComp = typeDef.icon;
                  const isChoice = ["select", "radio", "checkbox"].includes(field.type);

                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-4 group"
                    >
                      {/* Card Header: Type, Position, Action Buttons */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-[11px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                            <IconComp size={13} />
                            <span>{typeDef.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Reorder Buttons */}
                          <button
                            onClick={() => handleMoveField(index, -1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            onClick={() => handleMoveField(index, 1)}
                            disabled={index === editingForm.fields.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown size={15} />
                          </button>

                          <div className="h-4 w-px bg-slate-200 mx-1" />

                          {/* Delete Field */}
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Question Label & Help Text Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Question Title / Label <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                            placeholder="e.g. Dietary Requirements or Keynote Rating"
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Helper Text / Subtitle
                          </label>
                          <input
                            type="text"
                            value={field.helpText || ""}
                            onChange={(e) => handleUpdateField(field.id, { helpText: e.target.value })}
                            placeholder="Optional instructions for attendee..."
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Choice Options Manager (for select, radio, checkbox) */}
                      {isChoice && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Answer Choices / Options
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {optIdx + 1}
                                </div>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(field.id, optIdx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-600 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                                />
                                {(field.options || []).length > 1 && (
                                  <button
                                    onClick={() => handleDeleteOption(field.id, optIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleAddOption(field.id)}
                            className="self-start text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <Plus size={13} /> Add Another Choice
                          </button>
                        </div>
                      )}

                      {/* Placeholder field (for text/textarea/number/email) */}
                      {["text", "textarea", "number", "email"].includes(field.type) && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Input Placeholder Hint
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                            placeholder="e.g. Enter your job title..."
                            className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-700 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* Rating Scale Details */}
                      {field.type === "rating" && (
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-amber-50/50 border border-amber-200/50 rounded-2xl p-3">
                          <Star size={16} className="text-amber-500 fill-amber-500" />
                          <span>5-Star Interactive Rating Scale with live score analytics.</span>
                        </div>
                      )}

                      {/* Required Toggle Footer */}
                      {field.type !== "section" && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-xs font-bold text-slate-700">Required Question</span>
                          </label>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {field.required ? "Attendee must answer before submission" : "Optional for attendee"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 2: FORM SETTINGS                                            */}
        {/* =================================================================== */}
        {builderTab === "settings" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs flex flex-col gap-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Form Configuration & Target</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure who sees this form, where responses are routed, and post-submission confirmations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Form Category & Purpose
                </label>
                <select
                  value={editingForm.type}
                  onChange={(e) => setEditingForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="ticket_registration">🎟️ Ticket Registration & Checkout Intake</option>
                  <option value="feedback_survey">⭐ Post-Event Attendee Feedback & CSAT</option>
                  <option value="session_survey">🎤 Breakout Session / Speaker Evaluation</option>
                  <option value="general_inquiry">📄 Call for Papers & General Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Publication Status
                </label>
                <select
                  value={editingForm.status}
                  onChange={(e) => setEditingForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="active">Active (Accepting Responses)</option>
                  <option value="draft">Draft (Hidden from Public)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Ticket Tier Binding */}
            {editingForm.type === "ticket_registration" && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col gap-2">
                <label className="block text-xs font-bold text-blue-900">
                  Target Ticket Tier Assignment
                </label>
                <select
                  value={editingForm.ticketId}
                  onChange={(e) => setEditingForm(prev => ({ ...prev, ticketId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">Apply to All Ticket Tiers</option>
                  {tickets.map(t => (
                    <option key={t.id || t.tier || t.name} value={t.tier || t.name}>
                      Only apply to: {t.tier || t.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-blue-700 font-medium">
                  When attendees purchase this tier on the landing page, these questions will be presented during checkout.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Submit Button Text
              </label>
              <input
                type="text"
                value={editingForm.settings?.submitButtonText || "Submit"}
                onChange={(e) => setEditingForm(prev => ({
                  ...prev,
                  settings: { ...(prev.settings || {}), submitButtonText: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Post-Submission Success Message
              </label>
              <textarea
                value={editingForm.settings?.successMessage || ""}
                onChange={(e) => setEditingForm(prev => ({
                  ...prev,
                  settings: { ...(prev.settings || {}), successMessage: e.target.value }
                }))}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Allow Anonymous Submissions</span>
                <span className="text-[11px] text-slate-400">Great for candid attendee reviews and ratings</span>
              </div>
              <input
                type="checkbox"
                checked={editingForm.settings?.allowAnonymous || false}
                onChange={(e) => setEditingForm(prev => ({
                  ...prev,
                  settings: { ...(prev.settings || {}), allowAnonymous: e.target.checked }
                }))}
                className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 3: LIVE SIMULATOR / PREVIEW                                 */}
        {/* =================================================================== */}
        {builderTab === "preview" && (
          <div className="flex flex-col items-center gap-6">
            {/* Device Switcher */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-xs">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  previewDevice === "desktop" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
                }`}
              >
                <Monitor size={14} />
                <span>Desktop Screen</span>
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  previewDevice === "mobile" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
                }`}
              >
                <Smartphone size={14} />
                <span>Mobile Device (375px)</span>
              </button>
            </div>

            {/* Simulated Frame */}
            <div className={`w-full transition-all duration-300 ${
              previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl"
            }`}>
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
                {previewSubmitted ? (
                  <div className="text-center py-10 flex flex-col items-center gap-4 animate-scale-up">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Check size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Submission Successful</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {editingForm.settings?.successMessage || "Thank you! Your response has been recorded."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPreviewSubmitted(false);
                        setPreviewAnswers({});
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} /> Test Again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePreviewSubmit} className="flex flex-col gap-5">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
                        {activeEventTitle}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">{editingForm.title}</h2>
                      {editingForm.description && (
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                          {editingForm.description}
                        </p>
                      )}
                    </div>

                    {/* Dynamic Fields Simulator */}
                    {(editingForm.fields || []).map(field => {
                      if (field.type === "section") {
                        return (
                          <div key={field.id} className="pt-3 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900">{field.label}</h4>
                            {field.helpText && <p className="text-xs text-slate-400 mt-0.5">{field.helpText}</p>}
                          </div>
                        );
                      }

                      return (
                        <div key={field.id} className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                            <span>
                              {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </span>
                          </label>
                          {field.helpText && (
                            <span className="text-[11px] text-slate-400 font-medium -mt-1">
                              {field.helpText}
                            </span>
                          )}

                          {/* Short Text / Email / Number */}
                          {["text", "email", "number"].includes(field.type) && (
                            <input
                              type={field.type}
                              required={field.required}
                              placeholder={field.placeholder || "Your answer..."}
                              value={previewAnswers[field.id] || ""}
                              onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                            />
                          )}

                          {/* Paragraph / Textarea */}
                          {field.type === "textarea" && (
                            <textarea
                              required={field.required}
                              rows={3}
                              placeholder={field.placeholder || "Enter detailed feedback..."}
                              value={previewAnswers[field.id] || ""}
                              onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
                            />
                          )}

                          {/* Dropdown Select */}
                          {field.type === "select" && (
                            <select
                              required={field.required}
                              value={previewAnswers[field.id] || ""}
                              onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                            >
                              <option value="">Select an option...</option>
                              {(field.options || []).map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}

                          {/* Radio Choices */}
                          {field.type === "radio" && (
                            <div className="flex flex-col gap-2 mt-1">
                              {(field.options || []).map((opt, i) => (
                                <label key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                  <input
                                    type="radio"
                                    name={field.id}
                                    required={field.required}
                                    checked={previewAnswers[field.id] === opt}
                                    onChange={() => setPreviewAnswers(prev => ({ ...prev, [field.id]: opt }))}
                                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                  />
                                  <span className="text-xs font-semibold text-slate-800">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Checkboxes */}
                          {field.type === "checkbox" && (
                            <div className="flex flex-col gap-2 mt-1">
                              {(field.options || []).map((opt, i) => {
                                const currentVals = previewAnswers[field.id] || [];
                                const isChecked = currentVals.includes(opt);
                                return (
                                  <label key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const next = e.target.checked
                                          ? [...currentVals, opt]
                                          : currentVals.filter(v => v !== opt);
                                        setPreviewAnswers(prev => ({ ...prev, [field.id]: next }));
                                      }}
                                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="text-xs font-semibold text-slate-800">{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* 5-Star Rating */}
                          {field.type === "rating" && (
                            <div className="flex items-center gap-2 mt-1">
                              {[1, 2, 3, 4, 5].map(star => {
                                const currentRating = previewAnswers[field.id] || 0;
                                const isSelected = star <= currentRating;
                                return (
                                  <button
                                    type="button"
                                    key={star}
                                    onClick={() => setPreviewAnswers(prev => ({ ...prev, [field.id]: star }))}
                                    className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                                  >
                                    <Star
                                      size={26}
                                      className={isSelected ? "text-amber-500 fill-amber-500" : "text-slate-300 hover:text-amber-400"}
                                    />
                                  </button>
                                );
                              })}
                              {previewAnswers[field.id] && (
                                <span className="text-xs font-bold text-amber-600 ml-2">
                                  {previewAnswers[field.id]} / 5 Stars
                                </span>
                              )}
                            </div>
                          )}

                          {/* NPS Scale 0 to 10 */}
                          {field.type === "nps" && (
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                                  const isSelected = previewAnswers[field.id] === score;
                                  return (
                                    <button
                                      type="button"
                                      key={score}
                                      onClick={() => setPreviewAnswers(prev => ({ ...prev, [field.id]: score }))}
                                      className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                                        isSelected
                                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-110"
                                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 mt-1">
                                <span>Not Likely</span>
                                <span>Extremely Likely</span>
                              </div>
                            </div>
                          )}

                          {/* Yes/No Switch */}
                          {field.type === "switch" && (
                            <label className="flex items-center gap-3 cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={previewAnswers[field.id] ?? field.defaultValue ?? false}
                                onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [field.id]: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                              <span className="text-xs font-semibold text-slate-700">
                                {previewAnswers[field.id] ? "Yes, consented" : "No"}
                              </span>
                            </label>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all mt-4 cursor-pointer"
                    >
                      {editingForm.settings?.submitButtonText || "Submit Response"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-TAB 4: SUBMISSIONS & ANALYTICS                                  */}
        {/* =================================================================== */}
        {builderTab === "submissions" && (
          <div className="flex flex-col gap-6">
            {/* Header & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submissions & Analytics ({activeSubmissions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time responses submitted by attendees and ticket holders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={activeSubmissions.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Download size={14} className="text-blue-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Ratings & Choice Analytics Cards */}
            {(editingForm.fields || []).some(f => ["rating", "nps"].includes(f.type)) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(editingForm.fields || []).filter(f => f.type === "rating").map(rf => {
                  const ratings = activeSubmissions
                    .map(s => s.answers?.[rf.id])
                    .filter(v => typeof v === "number");
                  const avg = ratings.length > 0
                    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                    : "0.0";
                  
                  return (
                    <div key={rf.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Average Rating
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">{rf.label}</h4>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-3xl font-extrabold text-slate-900">{avg}</span>
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={18}
                                className={s <= Math.round(Number(avg)) ? "fill-amber-500 text-amber-500" : "text-slate-200"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold mt-4">
                        Based on {ratings.length} attendee reviews
                      </span>
                    </div>
                  );
                })}

                {/* Submissions count card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Total Responses
                    </span>
                    <div className="text-3xl font-extrabold text-slate-900 mt-2">{activeSubmissions.length}</div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-4">
                    <Check size={14} /> 100% submission integrity
                  </span>
                </div>
              </div>
            )}

            {/* Submissions Data Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              {activeSubmissions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No submissions have been recorded for this form yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Respondent</th>
                        <th className="py-3.5 px-4">Ticket Tier</th>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Sample Answers</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900">{sub.respondentName || "Anonymous"}</div>
                            <div className="text-[11px] text-slate-400">{sub.respondentEmail || "No email provided"}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                              {sub.ticketTier || "Standard"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {new Date(sub.createdAt).toLocaleDateString()} at {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium">
                            {sub.answers ? (
                              Object.entries(sub.answers)
                                .slice(0, 2)
                                .map(([k, v]) => `${k.replace('field_', '')}: ${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : Array.isArray(v) ? v.join(', ') : v}`)
                                .join(' · ')
                            ) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setInspectSubmission(sub)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              View Full Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Detail Modal */}
        {inspectSubmission && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Submission Details</h3>
                  <p className="text-xs text-slate-400">
                    Recorded {new Date(inspectSubmission.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setInspectSubmission(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Respondent Info */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{inspectSubmission.respondentName}</div>
                  <div className="text-xs text-slate-500">{inspectSubmission.respondentEmail}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                  {inspectSubmission.ticketTier}
                </span>
              </div>

              {/* Answer breakdown */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Submitted Question Responses
                </span>
                {(editingForm.fields || []).filter(f => f.type !== "section").map(f => {
                  const val = inspectSubmission.answers ? inspectSubmission.answers[f.id] : null;
                  return (
                    <div key={f.id} className="border-b border-slate-100 pb-2.5">
                      <div className="text-xs font-bold text-slate-700">{f.label}</div>
                      <div className="text-xs font-semibold text-slate-900 mt-1">
                        {val === null || val === undefined ? (
                          <span className="text-slate-400 italic">No response</span>
                        ) : typeof val === "boolean" ? (
                          val ? "Yes / Confirmed" : "No"
                        ) : f.type === "rating" ? (
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            {val} / 5 Stars ⭐
                          </span>
                        ) : Array.isArray(val) ? (
                          val.join(", ")
                        ) : (
                          String(val)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setInspectSubmission(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: HUB (All Forms Overview, Template Library, Stat Cards)
  // =========================================================================
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Forms & Surveys Builder</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Build custom ticket registration intake questionnaires, feedback CSAT forms, and speaker proposals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTemplateModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>Templates Library</span>
          </button>

          <button
            onClick={handleOpenCreateBlank}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Form</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Forms</span>
              <FileText size={18} className="text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.total}</div>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-4 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {stats.activeCount} active & accepting responses
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Ticket Questionnaires</span>
              <UserCheck size={18} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.ticketForms}</div>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold mt-4">
            Linked to ticket checkout flows
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Submissions</span>
              <MessageSquare size={18} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{stats.totalSubs}</div>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold mt-4">
            Responses saved in database
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Attendee Rating</span>
              <Star size={18} className="text-amber-500 fill-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-1.5">
              <span>{stats.avgRating}</span>
              <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
            </div>
          </div>
          <span className="text-[11px] text-amber-600 font-bold mt-4">
            ⭐ CSAT Score: {((Number(stats.avgRating) / 5) * 100).toFixed(0)}% Positive
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search forms by title or question..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 rounded-2xl text-xs font-semibold text-slate-900 outline-none shadow-xs transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["All", "Ticket Registration", "Feedback & Survey", "Inquiries & Proposals"].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Form Cards Grid */}
      {filteredForms.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText size={26} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No forms found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Create a custom form or explore our templates library to start collecting responses.
            </p>
          </div>
          <button
            onClick={() => setTemplateModalOpen(true)}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20"
          >
            Explore Pre-built Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => {
            const formSubs = submissions.filter(s => s.formId === form.id);
            const isTicket = form.type === "ticket_registration";
            const isFeedback = form.type === "feedback_survey" || form.type === "session_survey";

            return (
              <div
                key={form.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-5 group"
              >
                {/* Header info */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isTicket ? "bg-emerald-100 text-emerald-700" :
                      isFeedback ? "bg-violet-100 text-violet-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {form.type.replace(/_/g, " ")}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      form.status === "active" ? "bg-emerald-50 text-emerald-700 font-extrabold" : "bg-slate-100 text-slate-500"
                    }`}>
                      {form.status === "active" ? "● Active" : "Draft"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {form.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">
                      {form.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100">
                    <span>{form.fields?.length || 0} Questions</span>
                    <span>·</span>
                    <span className="text-slate-700 font-bold">{formSubs.length} Submissions</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleEditForm(form)}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Edit Questions
                  </button>

                  <button
                    onClick={() => handleViewResponses(form)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="View Responses & Analytics"
                  >
                    <BarChart2 size={16} />
                  </button>

                  <button
                    onClick={() => handleOpenShare(form)}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Share / QR Code"
                  >
                    <QrCode size={16} />
                  </button>

                  <button
                    onClick={() => handleDuplicateForm(form)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Duplicate Form"
                  >
                    <Copy size={16} />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${form.title}"?`)) {
                        onDeleteForm(form.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Form"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TEMPLATE PICKER MODAL                                                 */}
      {/* ===================================================================== */}
      {templateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 max-w-2xl w-full shadow-2xl flex flex-col gap-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  <span>Choose a Form Template</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a pre-designed template tailored for events, tickets, and feedback collection.
                </p>
              </div>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {PRESET_TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleOpenTemplate(tpl)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex flex-col gap-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {tpl.title}
                      </h4>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {tpl.description}
                    </p>
                    <span className="text-[11px] text-blue-600 font-semibold mt-1">
                      Includes {tpl.fields.length} pre-configured questions
                    </span>
                  </div>

                  <button className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs group-hover:scale-105 transition-transform shrink-0">
                    Use Template
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTemplateModalOpen(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SHARE / QR CODE MODAL                                                 */}
      {/* ===================================================================== */}
      {shareModalForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 max-w-md w-full shadow-2xl flex flex-col gap-6 text-center animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
              <div>
                <h3 className="text-base font-bold text-slate-900">Share Form & QR Code</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{shareModalForm.title}</p>
              </div>
              <button
                onClick={() => setShareModalForm(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code Canvas */}
            <div className="flex flex-col items-center gap-3 bg-slate-50 rounded-2xl p-6 border border-slate-100">
              {shareQrUrl ? (
                <img src={shareQrUrl} alt="Form QR Code" className="w-48 h-48 rounded-xl shadow-xs" />
              ) : (
                <div className="w-48 h-48 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <span className="text-xs text-slate-500 font-semibold">
                Scan on mobile to open live feedback form
              </span>
            </div>

            {/* Share Link Copy */}
            <button
              onClick={handleCopyShareLink}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Direct Public Link"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
