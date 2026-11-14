import React, { useMemo, useState } from 'react';
import {
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  MapPin,
  Megaphone,
  PlusCircle,
  QrCode,
  Search,
  Send,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { DEPARTMENTS, INDUSTRIES, YEARS } from '../data/seedData';
import type {
  AttendanceRecord,
  CampusAnnouncement,
  Opportunity,
  OpportunityMode,
  OpportunityType,
} from '../types/ncet';

interface OrganizerPortalViewProps {
  opportunities: Opportunity[];
  attendanceRecords: AttendanceRecord[];
  onCreateOpportunity: (
    draft: Omit<Opportunity, 'id' | 'organizerId' | 'createdAt' | 'updatedAt' | 'status'>
  ) => Promise<Opportunity>;
  onOrganizerMarkAttendance: (recordId: string, present: boolean) => void;
  onPostAnnouncement: (announcement: Omit<CampusAnnouncement, 'id' | 'createdAt'>) => void;
}

const CLUBS = [
  'GDG on Campus NCET',
  'NCET Robotics & Automation Club',
  'CodeChef NCET Campus Chapter',
  'NCET CSE & Innovation Cell',
  'IEEE Student Branch NCET',
  'NCET Placement & Career Cell',
];

export const OrganizerPortalView: React.FC<OrganizerPortalViewProps> = ({
  opportunities,
  attendanceRecords,
  onCreateOpportunity,
  onOrganizerMarkAttendance,
  onPostAnnouncement,
}) => {
  const [organizerTab, setOrganizerTab] = useState<'create' | 'attendance' | 'broadcast'>('create');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState(CLUBS[0]);
  const [type, setType] = useState<OpportunityType>('Workshop');
  const [domain, setDomain] = useState('AI & ML');
  const [industry, setIndustry] = useState('AI & Robotics');
  const [mode, setMode] = useState<OpportunityMode>('On-Campus');
  const [venue, setVenue] = useState('NCET Innovation Auditorium, Block B');
  const [eventDate, setEventDate] = useState('2026-12-18');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 04:00 PM');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['CSE', 'AI & ML']);
  const [selectedYears, setSelectedYears] = useState<string[]>(['2nd Year', '3rd Year']);
  const [tagsText, setTagsText] = useState('Python, ReactJS, Vector Search');
  const [availabilitySlot, setAvailabilitySlot] = useState('Weekends');
  const [goalMatch, setGoalMatch] = useState('AI Systems Engineer');
  const [deadline, setDeadline] = useState('2026-12-15');
  const [maxCapacity, setMaxCapacity] = useState('120');
  const [checkInCode, setCheckInCode] = useState('NCET99');
  const [stipendOrPrize, setStipendOrPrize] = useState('Verified Certificate + Lab Grant');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  // Attendance manager state
  const [selectedEventId, setSelectedEventId] = useState<string>(
    opportunities[1]?.id || opportunities[0]?.id || ''
  );
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');

  // Broadcast notification state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastSummary, setBroadcastSummary] = useState('');
  const [broadcastDept, setBroadcastDept] = useState('All Departments');
  const [broadcastYear, setBroadcastYear] = useState('All Years');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'urgent' | 'pinned'>(
    'normal'
  );
  const [broadcastSentMessage, setBroadcastSentMessage] = useState<string | null>(null);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const selectedEvent = useMemo(
    () => opportunities.find((o) => o.id === selectedEventId) || opportunities[0],
    [opportunities, selectedEventId]
  );

  const eventAttendees = useMemo(() => {
    if (!selectedEvent) return [];
    return attendanceRecords.filter((a) => {
      const matchEvent = a.opportunityId === selectedEvent.id;
      const q = attendeeSearchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.studentName.toLowerCase().includes(q) ||
        a.studentEmail.toLowerCase().includes(q) ||
        a.department.toLowerCase().includes(q);
      return matchEvent && matchSearch;
    });
  }, [attendanceRecords, attendeeSearchQuery, selectedEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organization.trim() || !description.trim()) {
      setBanner('Please complete the opportunity title, organization, and description.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await onCreateOpportunity({
        title: title.trim(),
        organization: organization.trim(),
        type,
        domain,
        industry,
        mode,
        venue: venue.trim(),
        eventDate,
        timeSlot: timeSlot.trim(),
        departments: selectedDepts.length ? selectedDepts : ['All Departments'],
        eligibleYears: selectedYears.length ? selectedYears : YEARS,
        tags: tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        availabilitySlot,
        goalMatch,
        deadline,
        sourceGroup: 'Campus',
        sourceName: organization.trim(),
        description: description.trim(),
        stipendOrPrize: stipendOrPrize.trim() || 'See details',
        maxCapacity: Number(maxCapacity) || 100,
        registeredCount: 0,
        attendedCount: 0,
        checkInCode: checkInCode.trim() || 'NCET01',
        isExternal: false,
      });
      setTitle('');
      setDescription('');
      setBanner(`Submitted "${created.title}" for publishing.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastSummary.trim()) return;
    onPostAnnouncement({
      title: broadcastTitle.trim(),
      summary: broadcastSummary.trim(),
      author: organization,
      category: type,
      priority: broadcastPriority,
      targetDept: broadcastDept,
      targetYear: broadcastYear,
    });
    setBroadcastTitle('');
    setBroadcastSummary('');
    setBroadcastSentMessage('Targeted campus announcement delivered to eligible student feeds!');
    setTimeout(() => setBroadcastSentMessage(null), 3500);
  };

  const handleExportAttendanceCSV = () => {
    if (!selectedEvent || eventAttendees.length === 0) return;
    const header = 'Record ID,Student Name,Institutional Email,Department,Year,Method,Verified,Marked At\n';
    const rows = eventAttendees
      .map(
        (a) =>
          `"${a.id}","${a.studentName}","${a.studentEmail}","${a.department}","${a.year}","${a.method}","${a.verified ? 'YES' : 'NO'}","${a.markedAt}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEvent.title.replace(/\s+/g, '_')}_Attendance.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const campusListings = opportunities.filter((o) => o.status === 'published').slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header & Organizer Club Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Organizer Workspace
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Campus Club & Event Management Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage event submissions, live check-in desks, attendance records, and targeted student broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Active Club / Dept:</label>
          <select
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            {CLUBS.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Organizer Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setOrganizerTab('create')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            organizerTab === 'create'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Create / Submit Event
        </button>
        <button
          type="button"
          onClick={() => setOrganizerTab('attendance')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            organizerTab === 'attendance'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Attendance & Check-In Desk
        </button>
        <button
          type="button"
          onClick={() => setOrganizerTab('broadcast')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            organizerTab === 'broadcast'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Targeted Notifications Broadcast
        </button>
      </div>

      {/* TAB 1: CREATE EVENT */}
      {organizerTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Campus Event or Technical Competition
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Submit event details with venue, schedule, check-in passcodes, and targeted eligibility.
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. NCET Web3 Hackfest or GDG Workshop"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hosting Organization / Club
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as OpportunityType)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Meetup">Meetup</option>
                    <option value="Competition">Competition</option>
                    <option value="Internship">Internship</option>
                    <option value="Campus Drive">Campus Drive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as OpportunityMode)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="On-Campus">On-Campus</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Offline">Offline</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Venue & Event Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Venue
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Block B Auditorium"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="10:00 AM - 04:00 PM"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Passcode & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-In Passcode (For Student Verification)
                  </label>
                  <input
                    type="text"
                    value={checkInCode}
                    onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                    placeholder="e.g. GDG782"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Participant Capacity
                  </label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Target Departments */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Academic Departments
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENTS.filter((d) => d !== 'All Departments').map((dept) => {
                    const active = selectedDepts.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleItem(selectedDepts, dept, setSelectedDepts)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          active
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Years */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Eligible Academic Years
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {YEARS.map((yr) => {
                    const active = selectedYears.includes(yr);
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => toggleItem(selectedYears, yr, setSelectedYears)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          active
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Eligibility Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe schedule, venue directions, prerequisites, and certificates..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {banner && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {banner}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2.5 text-xs font-semibold text-white transition-colors shadow"
              >
                <PlusCircle className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Event for Admin Review'}
              </button>
            </form>
          </section>

          {/* Active Postings Sidebar */}
          <aside className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Live Campus & Partner Listings
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Active opportunities currently surfaced in student feeds
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {campusListings.map((opp) => (
                <div key={opp.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {opp.type} · {opp.mode}
                    </span>
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      Passcode: {opp.checkInCode || 'NCET01'}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {opp.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {opp.organization} · Targets {opp.departments.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & CHECK-IN DESK */}
      {organizerTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Live Event Attendance & Check-In Desk
                </h2>
                <p className="text-xs text-slate-500">
                  Select an event to view attendees, verify attendance, generate check-in codes, and export attendance records.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {opportunities
                    .filter((o) => o.status === 'published')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title} ({o.organization})
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportAttendanceCSV}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Event Stats Card */}
            {selectedEvent && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Event Date & Venue</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedEvent.eventDate || selectedEvent.deadline}
                  </div>
                  <div className="text-[11px] text-slate-500">{selectedEvent.venue || 'NCET Campus'}</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Live Check-In Passcode</div>
                  <div className="text-lg font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedEvent.checkInCode || 'NCET2026'}
                  </div>
                  <div className="text-[10px] text-slate-400">Project on screen for students</div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Total Check-Ins</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {eventAttendees.filter((a) => a.verified).length} Students
                  </div>
                  <div className="text-[10px] text-slate-400">
                    of {selectedEvent.maxCapacity || 100} capacity
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Verified Turnout Rate</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedEvent.registeredCount
                      ? Math.round(
                          ((selectedEvent.attendedCount || eventAttendees.length) /
                            selectedEvent.registeredCount) *
                            100
                        )
                      : 88}
                    %
                  </div>
                  <div className="text-[10px] text-slate-400">Registered vs Verified</div>
                </div>
              </div>
            )}

            {/* Attendee Search */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search attendee by student name, USN or department..."
                value={attendeeSearchQuery}
                onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            {/* Attendees Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Institutional Email</th>
                    <th className="px-4 py-3">Dept & Year</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Attendance Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {eventAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                        No check-in records found for this event. Students can check in using passcode{' '}
                        <span className="font-mono font-bold text-blue-600">
                          {selectedEvent?.checkInCode || 'NCET2026'}
                        </span>.
                      </td>
                    </tr>
                  ) : (
                    eventAttendees.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {att.studentName}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {att.studentEmail}
                        </td>
                        <td className="px-4 py-3">
                          {att.department} · {att.year}
                        </td>
                        <td className="px-4 py-3 uppercase text-[10px] font-bold">
                          {att.method}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-400">
                          {new Date(att.markedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              att.verified
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                            }`}
                          >
                            {att.verified ? 'Verified Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onOrganizerMarkAttendance(att.id, !att.verified)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Toggle Present
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST NOTIFICATIONS */}
      {organizerTab === 'broadcast' && (
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Megaphone className="w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Broadcast Targeted Announcement
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Deliver official announcements directly to student home feeds and mobile push channels filtered by department and academic year.
          </p>

          <form onSubmit={handleBroadcastSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mandatory Briefing for Hackathon Participants at 3:00 PM"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message Content
              </label>
              <textarea
                rows={3}
                required
                placeholder="Details of the announcement, venue changes, or submission links..."
                value={broadcastSummary}
                onChange={(e) => setBroadcastSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Department
                </label>
                <select
                  value={broadcastDept}
                  onChange={(e) => setBroadcastDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="All Departments">All Departments</option>
                  {DEPARTMENTS.filter((d) => d !== 'All Departments').map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Year
                </label>
                <select
                  value={broadcastYear}
                  onChange={(e) => setBroadcastYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="All Years">All Years</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Urgency Level
                </label>
                <select
                  value={broadcastPriority}
                  onChange={(e) =>
                    setBroadcastPriority(e.target.value as 'normal' | 'urgent' | 'pinned')
                  }
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="pinned">Pinned Banner</option>
                </select>
              </div>
            </div>

            {broadcastSentMessage && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 p-2.5 rounded-lg border border-emerald-200">
                {broadcastSentMessage}
              </p>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              Send Targeted Broadcast
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
