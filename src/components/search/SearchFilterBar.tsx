
import { useState } from "react";
import { Send, Sparkles, Calendar, Plus, Minus, MapPin, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  onChange: (state: { query: string; guests: number; date?: { from?: Date; to?: Date } }) => void;
  onModeChange?: (mode: 'chat' | 'search') => void;
  onSendMessage?: (message: string) => void;
};

export default function SearchFilterBar({ onChange, onModeChange, onSendMessage }: Props) {
  const [isFlipped, setIsFlipped] = useState(true);
  const [message, setMessage] = useState("");
  const [showCheckInCal, setShowCheckInCal] = useState(false);
  const [showCheckOutCal, setShowCheckOutCal] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [location, setLocation] = useState("");
  // Removed hardcoded PROVINCES, replaced with purely dynamic logic
  const [suggestions, setSuggestions] = useState<{ label: string; type: "province" | "place" | "listing" }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowCheckInCal(false);
    setShowCheckOutCal(false);
    onModeChange?.(!isFlipped ? 'chat' : 'search');
  };

  const emit = (loc = location, g = guests, from = checkIn ?? undefined, to = checkOut ?? undefined) => {
    onChange({ query: loc, guests: g, date: { from, to } });
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), i - today.getDay() + 1);
      days.push(date);
    }
    return days;
  };

  let debounceTimer: any;
  const handleLocationChange = (v: string) => {
    setLocation(v);
    emit(v);
    setShowSuggestions(v.trim().length > 0);
    setActiveIndex(-1);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (!v.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const { data } = await supabase
          .from("properties")
          .select("title, location, province")
          .or(`location.ilike.%${v}%,title.ilike.%${v}%,province.ilike.%${v}%`)
          .limit(6);

        const places = new Set<string>();
        const listings: { label: string; type: "listing" }[] = [];
        const provinces = new Set<string>();

        (data || []).forEach((p: any) => {
          if (p.location && !places.has(p.location)) places.add(p.location);
          if (p.title) listings.push({ label: p.title, type: "listing" });
          if (p.province && p.province.toLowerCase().includes(v.toLowerCase())) provinces.add(p.province);
        });

        const placeItems = Array.from(places).slice(0, 5).map(l => ({ label: l, type: "place" as const }));
        const provinceItems = Array.from(provinces).slice(0, 3).map(p => ({ label: p, type: "province" as const }));

        const merged = [...provinceItems, ...placeItems, ...listings.slice(0, 3)];
        setSuggestions(merged);
      } catch {
        setSuggestions([]);
      }
    }, 200);
  };

  const pickSuggestion = (s: { label: string; type: "province" | "place" | "listing" }) => {
    setLocation(s.label);
    emit(s.label);
    setShowSuggestions(false);
  };

  const onLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(0, i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDateSelect = (date: Date, type: "checkin" | "checkout") => {
    if (type === "checkin") {
      setCheckIn(date);
      setShowCheckInCal(false);
      setTimeout(() => setShowCheckOutCal(true), 300);
      emit(location, guests, date, checkOut ?? undefined);
    } else {
      setCheckOut(date);
      setShowCheckOutCal(false);
      emit(location, guests, checkIn ?? undefined, date);
    }
  };

  const CalendarDropdown = ({ onSelect, selectedDate, type }: { onSelect: (d: Date) => void; selectedDate: Date | null; type: "checkin" | "checkout" }) => {
    const days = generateCalendarDays();
    const today = new Date();
    const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
      <div
        className="absolute top-full mt-2 bg-white rounded-2xl p-4 z-40 w-[320px]"
        style={{
          animation: "slideDown 0.3s ease-out",
          left: type === "checkin" ? "0" : "auto",
          right: type === "checkout" ? "0" : "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
          minWidth: "300px",
        }}
      >
        <div className="text-center mb-3">
          <h3 className="text-slate-800 font-semibold">{monthName}</h3>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 p-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today && !isToday;
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={idx}
                onClick={() => !isPast && onSelect(date)}
                disabled={isPast}
                className={`p-2 rounded-lg text-sm transition-all ${isPast ? "text-slate-300 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"} ${isToday ? "bg-blue-100 text-blue-600 font-semibold" : ""} ${isSelected ? "bg-blue-500 text-white font-semibold" : "text-slate-700"}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-0 flex items-center justify-center">
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className={`w-full max-w-3xl mx-auto mt-2 mb-2 ${!isFlipped ? 'fixed bottom-8 left-1/2 -translate-x-1/2 z-40' : ''}`}>
        <div className="bg-white rounded-full border border-gray-200 shadow-xl shadow-gray-200/50 p-1.5 relative z-30 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
          <div className="relative h-14 z-30">
            <div
              className="absolute w-full h-full z-30"
              style={{ transformStyle: "preserve-3d", transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)", transform: isFlipped ? "rotateX(180deg)" : "rotateX(0deg)" }}
            >
              <div className="absolute w-full h-full" style={{ backfaceVisibility: "hidden" }}>
                <div className="bg-white rounded-full p-2 flex items-center gap-3 h-full">
                  <button onClick={handleFlip} className="p-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-4 h-4 text-white" />
                  </button>
                  <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your dream stay..." className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-base px-2 font-medium" />
                  <button className="p-2.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30" onClick={() => onSendMessage?.(message)}>
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="absolute w-full h-full" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
                <div className="bg-white rounded-full p-1 flex items-center h-full divide-x divide-gray-100">
                  <button onClick={handleFlip} className="p-3 rounded-full hover:bg-gray-50 transition-colors mr-1">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                  </button>

                  <div className="relative flex-1 px-4 hover:bg-gray-50 rounded-full transition-colors cursor-pointer group">
                    <div className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-0.5">Where</div>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onKeyDown={onLocationKeyDown}
                      placeholder="Search destinations"
                      className="w-full bg-transparent border-none text-gray-600 text-sm outline-none placeholder-gray-400 truncate"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 mt-4 bg-white rounded-2xl border border-gray-100 shadow-xl w-[350px] z-50 overflow-hidden py-2">
                        <ul className="max-h-64 overflow-auto">
                          {suggestions.map((s, idx) => (
                            <li key={`${s.type}-${s.label}-${idx}`}>
                              <button
                                className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeIndex === idx ? "bg-gray-50" : ""}`}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onClick={() => pickSuggestion(s)}
                              >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{s.label}</span>
                                  <span className="text-xs text-gray-500 capitalize">{s.type}</span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="relative px-4 hover:bg-gray-50 rounded-full transition-colors cursor-pointer min-w-[120px]" onClick={() => { setShowCheckInCal(!showCheckInCal); setShowCheckOutCal(false); }}>
                    <div className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-0.5">Check in</div>
                    <div className={`text-sm ${checkIn ? "text-gray-900 font-medium" : "text-gray-400"}`}>{checkIn ? formatDate(checkIn) : "Add dates"}</div>
                    {showCheckInCal && (
                      <CalendarDropdown onSelect={(date) => handleDateSelect(date, "checkin")} selectedDate={checkIn} type="checkin" />
                    )}
                  </div>

                  <div className="relative px-4 hover:bg-gray-50 rounded-full transition-colors cursor-pointer min-w-[120px]" onClick={() => { setShowCheckOutCal(!showCheckOutCal); setShowCheckInCal(false); }}>
                    <div className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-0.5">Check out</div>
                    <div className={`text-sm ${checkOut ? "text-gray-900 font-medium" : "text-gray-400"}`}>{checkOut ? formatDate(checkOut) : "Add dates"}</div>
                    {showCheckOutCal && (
                      <CalendarDropdown onSelect={(date) => handleDateSelect(date, "checkout")} selectedDate={checkOut} type="checkout" />
                    )}
                  </div>

                  <div className="relative px-4 hover:bg-gray-50 rounded-full transition-colors cursor-pointer flex-1">
                    <div className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-0.5">Who</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-900 font-medium">{guests} {guests === 1 ? "guest" : "guests"}</span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { const g = Math.max(1, guests - 1); setGuests(g); emit(location, g); }} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-800 transition-colors">
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <button onClick={() => { const g = guests + 1; setGuests(g); emit(location, g); }} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-800 transition-colors">
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pl-2 pr-1 flex items-center">
                    <button className="p-3 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-all shadow-lg shadow-primary/30" onClick={() => emit()}>
                      <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
