import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, CalendarDays, MessageSquare, Award, CheckSquare, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { Pagination } from '../components/Pagination';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const handleSearch = async (searchTerm = query, targetPage = 1) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setSearchParams({ q: searchTerm });
    try {
      const data = await api.search.query(searchTerm, null, targetPage, 20);
      setResults(data);
      if (data.total_results !== undefined) {
          setTotalItems(data.total_results);
          // Calculate total pages for unified search based on total results and max page size
          setTotalPages(Math.ceil(data.total_results / 20) || 1);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      handleSearch(query, page);
    }
  }, [page]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, []);

  const highlightMatch = (text, term) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={i} style={{ background: 'rgba(99, 102, 241, 0.4)', color: '#ffffff', padding: '1px 4px', borderRadius: '3px' }}>
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div className="page-body animate-fade-in">
      {/* Header & Search Bar */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Universal History & Intelligence Search</h1>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Module 13: Search across transcripts, audio dialogues, decisions, action items, and executive summaries.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); handleSearch(query, 1); }}
          style={{ marginTop: '20px', position: 'relative', maxWidth: '640px' }}
        >
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Type keywords (e.g. decision, latency, deadline, security, roadmap)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '44px', paddingRight: '120px', height: '48px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', borderRadius: 'var(--radius-full)', padding: '0 18px' }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', marginRight: '4px' }}>Filter:</span>
          {['all', 'transcripts', 'tasks', 'summaries'].map(tf => (
            <button
              key={tf}
              onClick={() => setTypeFilter(tf)}
              className="tab-btn"
              style={{
                background: typeFilter === tf ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: typeFilter === tf ? '#ffffff' : 'var(--text-secondary)',
                border: typeFilter === tf ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                padding: '4px 12px',
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Results Feed */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Searching across all meetings and transcripts...</p>
      ) : results ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Found <strong>{results.total_results}</strong> matches for "<strong>{results.query}</strong>"
          </span>

          {/* 1. Transcript Segments Matches */}
          {(typeFilter === 'all' || typeFilter === 'transcripts') && results.results.transcript_segments && results.results.transcript_segments.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="#818cf8" />
                <span>Transcript Dialogue Matches ({results.results.transcript_segments.length})</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.results.transcript_segments.map((seg, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#818cf8' }}>{seg.speaker}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{seg.start_time}s - {seg.end_time}s</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
                      {highlightMatch(seg.text, results.query)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Meeting Matches */}
          {(typeFilter === 'all' || typeFilter === 'summaries') && results.results.meetings && results.results.meetings.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={16} color="#38bdf8" />
                <span>Meeting Title Matches ({results.results.meetings.length})</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.results.meetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/meetings/${m.id}`)}
                    className="glass-card glass-card-interactive"
                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>
                        {highlightMatch(m.title, results.query)}
                      </h4>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {new Date(m.scheduled_start).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="badge badge-info">{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Task Matches */}
          {(typeFilter === 'all' || typeFilter === 'tasks') && results.results.tasks && results.results.tasks.length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} color="#10b981" />
                <span>Task Matches ({results.results.tasks.length})</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.results.tasks.map((t) => (
                  <div key={t.id} style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h5 style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
                        {highlightMatch(t.title, results.query)}
                      </h5>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        Assignee: <strong>{t.assignee}</strong> • Priority: {t.priority?.toUpperCase()}
                      </span>
                    </div>
                    <RiskBadge riskLevel={t.risk_level} compact={true} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {!loading && totalItems > 0 && results && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={20}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
