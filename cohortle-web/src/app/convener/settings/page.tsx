'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import PasswordChangeForm from '@/components/profile/PasswordChangeForm';
import GenerateAvatarButton from '@/components/profile/GenerateAvatarButton';
import AvatarPreview from '@/components/profile/AvatarPreview';
import DriveConnectionSection from '@/components/convener/DriveConnectionSection';
import {
  getUserProfile,
  updateProfile,
  changePassword,
} from '@/lib/api/profile';
import { checkOrganisationSlug } from '@/lib/api/applications';
import {
  getOrgStats, updateOrgStats, OrgStats,
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, Testimonial,
  getOrgFaqs, createOrgFaq, updateOrgFaq, deleteOrgFaq, OrgFaq,
  syncOrgStats,
} from '@/lib/api/convener';

const SLUG_RE = /^[a-z0-9-]{3,50}$/;

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]';
const btnCls = 'px-4 py-2 bg-[#391D65] text-white text-sm font-medium rounded-md hover:bg-[#391D65]/90 disabled:opacity-50';
const dangerBtnCls = 'px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700';
const secondaryBtnCls = 'px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50';

export default function ConvenerSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshVerificationStatus } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Org fields
  const [slug, setSlug] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgTagline, setOrgTagline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [tawkPropertyId, setTawkPropertyId] = useState('');
  const [tawkWidgetId, setTawkWidgetId] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgMsg, setOrgMsg] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<OrgStats>({ total_learners: 0, programmes_completed: 0, success_rate: 0, years_experience: 0 });
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsMsg, setStatsMsg] = useState<string | null>(null);
  const [statsSyncing, setStatsSyncing] = useState(false);

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<Testimonial>({ learner_name: '', quote: '', rating: 5, is_featured: false });
  const [testimonialMsg, setTestimonialMsg] = useState<string | null>(null);
  const [testimonialSaving, setTestimonialSaving] = useState(false);

  // FAQs
  const [faqs, setFaqs] = useState<OrgFaq[]>([]);
  const [editingFaq, setEditingFaq] = useState<OrgFaq | null>(null);
  const [faqForm, setFaqForm] = useState<OrgFaq>({ question: '', answer: '', order_index: 0 });
  const [faqMsg, setFaqMsg] = useState<string | null>(null);
  const [faqSaving, setFaqSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const [{ user: profile }, statsData, testimonialsData, faqsData] = await Promise.all([
          getUserProfile(),
          getOrgStats().catch(() => ({ total_learners: 0, programmes_completed: 0, success_rate: 0, years_experience: 0 })),
          getTestimonials().catch(() => []),
          getOrgFaqs().catch(() => []),
        ]);
        setName(profile.name || '');
        setBio(profile.bio || '');
        setLinkedin(profile.linkedinUsername || '');
        if (profile.profilePicture) setAvatarUrl(profile.profilePicture);
        const p = profile as any;
        if (p.organisationSlug) setSlug(p.organisationSlug);
        if (p.organisationName) setOrgName(p.organisationName);
        if (p.organisationDescription) setOrgDesc(p.organisationDescription);
        if (p.organisationTagline) setOrgTagline(p.organisationTagline);
        if (p.contactEmail) setContactEmail(p.contactEmail);
        if (p.contactPhone) setContactPhone(p.contactPhone);
        if (p.websiteUrl) setWebsiteUrl(p.websiteUrl);
        if (p.linkedinUrl) setLinkedinUrl(p.linkedinUrl);
        if (p.twitterUrl) setTwitterUrl(p.twitterUrl);
        if (p.facebookUrl) setFacebookUrl(p.facebookUrl);
        if (p.instagramUrl) setInstagramUrl(p.instagramUrl);
        if (p.organisationLogoUrl) setOrgLogoUrl(p.organisationLogoUrl);
        if (p.heroImageUrl) setHeroImageUrl(p.heroImageUrl);
        if (p.introVideoUrl) setIntroVideoUrl(p.introVideoUrl);
        if (p.tawkPropertyId) setTawkPropertyId(p.tawkPropertyId);
        if (p.tawkWidgetId) setTawkWidgetId(p.tawkWidgetId);
        setStats(statsData as OrgStats);
        setTestimonials(testimonialsData);
        setFaqs(faqsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, authLoading, router]);

  const handleSaveProfile = async () => {
    setProfileSaving(true); setProfileMsg(null);
    try {
      await updateProfile({ name, bio, linkedinUsername: linkedin });
      setProfileMsg('Profile saved.');
    } catch (err: any) { setProfileMsg(err?.message || 'Failed to save profile.'); }
    finally { setProfileSaving(false); }
  };

  const handleAvatarGenerated = (newUrl: string) => {
    setAvatarUrl(newUrl);
    setAvatarRefreshKey(k => k + 1);
  };

  const handleSlugBlur = async () => {
    if (!slug) { setSlugStatus('idle'); return; }
    if (!SLUG_RE.test(slug)) { setSlugStatus('invalid'); return; }
    setSlugStatus('checking');
    try {
      const result = await checkOrganisationSlug(slug);
      setSlugStatus(result.available ? 'available' : 'taken');
    } catch { setSlugStatus('idle'); }
  };

  const handleSaveOrg = async () => {
    if (!SLUG_RE.test(slug)) return;
    setOrgSaving(true); setOrgMsg(null);
    try {
      await updateProfile({
        organisation_slug: slug, organisation_name: orgName, organisation_description: orgDesc,
        organisation_tagline: orgTagline, contact_email: contactEmail, contact_phone: contactPhone,
        website_url: websiteUrl, linkedin_url: linkedinUrl, twitter_url: twitterUrl,
        facebook_url: facebookUrl, instagram_url: instagramUrl,
        organisation_logo_url: orgLogoUrl, hero_image_url: heroImageUrl,
        intro_video_url: introVideoUrl, tawk_property_id: tawkPropertyId, tawk_widget_id: tawkWidgetId,
      } as any);
      await refreshVerificationStatus();
      setOrgMsg('Organisation settings saved.');
    } catch (err: any) { setOrgMsg(err?.message || 'Failed to save.'); }
    finally { setOrgSaving(false); }
  };

  const handleSaveStats = async () => {
    setStatsSaving(true); setStatsMsg(null);
    try {
      await updateOrgStats(stats);
      setStatsMsg('Stats saved.');
    } catch (err: any) { setStatsMsg(err?.message || 'Failed to save stats.'); }
    finally { setStatsSaving(false); }
  };

  const handleSyncStats = async () => {
    setStatsSyncing(true); setStatsMsg(null);
    try {
      const synced = await syncOrgStats();
      setStats(synced);
      setStatsMsg('Stats synced from real data.');
    } catch (err: any) { setStatsMsg(err?.message || 'Sync failed.'); }
    finally { setStatsSyncing(false); }
  };

  const handleSaveTestimonial = async () => {
    if (!testimonialForm.learner_name || !testimonialForm.quote) return;
    setTestimonialSaving(true); setTestimonialMsg(null);
    try {
      if (editingTestimonial?.id) {
        const updated = await updateTestimonial(editingTestimonial.id, testimonialForm);
        setTestimonials(ts => ts.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await createTestimonial(testimonialForm);
        setTestimonials(ts => [created, ...ts]);
      }
      setTestimonialForm({ learner_name: '', quote: '', rating: 5, is_featured: false });
      setEditingTestimonial(null);
      setTestimonialMsg('Saved.');
    } catch (err: any) { setTestimonialMsg(err?.message || 'Failed to save.'); }
    finally { setTestimonialSaving(false); }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      setTestimonials(ts => ts.filter(t => t.id !== id));
    } catch { alert('Failed to delete.'); }
  };

  const handleSaveFaq = async () => {
    if (!faqForm.question || !faqForm.answer) return;
    setFaqSaving(true); setFaqMsg(null);
    try {
      if (editingFaq?.id) {
        const updated = await updateOrgFaq(editingFaq.id, faqForm);
        setFaqs(fs => fs.map(f => f.id === updated.id ? updated : f));
      } else {
        const created = await createOrgFaq({ ...faqForm, order_index: faqs.length });
        setFaqs(fs => [...fs, created]);
      }
      setFaqForm({ question: '', answer: '', order_index: 0 });
      setEditingFaq(null);
      setFaqMsg('Saved.');
    } catch (err: any) { setFaqMsg(err?.message || 'Failed to save.'); }
    finally { setFaqSaving(false); }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await deleteOrgFaq(id);
      setFaqs(fs => fs.filter(f => f.id !== id));
    } catch { alert('Failed to delete.'); }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#391D65]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-sm text-red-600 underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => router.push('/convener/dashboard')} className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and organisation details</p>
      </div>

      <div className="space-y-6">
        {/* Avatar */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Avatar</h2>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <AvatarPreview avatarUrl={avatarUrl} userName={user?.name || 'Convener'} size="large" isLoading={isAvatarLoading} refreshKey={avatarRefreshKey} />
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">Generate a unique avatar that appears across the platform.</p>
              <GenerateAvatarButton currentAvatarUrl={avatarUrl} onAvatarGenerated={handleAvatarGenerated} disabled={isAvatarLoading} />
            </div>
          </div>
        </section>

        {/* Profile Info */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell learners a bit about yourself" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn username</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-500">linkedin.com/in/</span>
                <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="yourhandle" className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]" />
              </div>
            </div>
            {profileMsg && <p className={`text-sm ${profileMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>}
            <button onClick={handleSaveProfile} disabled={profileSaving} className={btnCls}>{profileSaving ? 'Saving…' : 'Save Profile'}</button>
          </div>
        </section>

        {/* Organisation Settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Organisation Settings</h2>
          <p className="text-sm text-gray-500 mb-4">Your public page is at <span className="font-mono text-[#391D65]">/org/[slug]</span>.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation slug <span className="text-red-500">*</span></label>
              <input type="text" value={slug} onChange={e => { setSlug(e.target.value.toLowerCase()); setSlugStatus('idle'); }} onBlur={handleSlugBlur} placeholder="e.g. wecareforng" className={inputCls} />
              <p className="mt-1 text-xs text-gray-400">Lowercase letters, numbers, hyphens. 3–50 characters.</p>
              {slugStatus === 'checking' && <p className="text-xs text-gray-500 mt-1">Checking…</p>}
              {slugStatus === 'available' && <p className="text-xs text-green-600 mt-1">✓ Available</p>}
              {slugStatus === 'taken' && <p className="text-xs text-red-600 mt-1">✗ Already taken</p>}
              {slugStatus === 'invalid' && <p className="text-xs text-red-600 mt-1">✗ Invalid format</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation name</label>
              <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. WeCare Foundation Nigeria" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation description</label>
              <textarea value={orgDesc} onChange={e => setOrgDesc(e.target.value)} rows={3} placeholder="Brief description shown on your organisation page" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input type="text" value={orgTagline} onChange={e => setOrgTagline(e.target.value)} placeholder="e.g. Empowering learners through education" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="url" value={orgLogoUrl} onChange={e => setOrgLogoUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero image URL</label>
                <input type="url" value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact email</label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="hello@yourorg.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact phone</label>
                <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+44 7700 900000" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourorganisation.com" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/..." className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter / X URL</label>
                <input type="url" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/yourhandle" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                <input type="url" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/yourpage" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                <input type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/yourhandle" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intro video URL</label>
              <input type="url" value={introVideoUrl} onChange={e => setIntroVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
              <p className="mt-1 text-xs text-gray-400">YouTube or Vimeo URL — shown as a welcome video on your org page.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tawk.to Property ID</label>
                <input type="text" value={tawkPropertyId} onChange={e => setTawkPropertyId(e.target.value)} placeholder="e.g. 64abc123def456" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tawk.to Widget ID</label>
                <input type="text" value={tawkWidgetId} onChange={e => setTawkWidgetId(e.target.value)} placeholder="e.g. 1h7abc123" className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-gray-400">Tawk.to IDs enable a live chat widget on your org page.</p>
            {orgMsg && <p className={`text-sm ${orgMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>{orgMsg}</p>}
            <button onClick={handleSaveOrg} disabled={orgSaving || slugStatus === 'taken' || slugStatus === 'invalid' || !slug} className={btnCls}>
              {orgSaving ? 'Saving…' : 'Save Organisation Settings'}
            </button>
          </div>
        </section>

        {/* Organisation Stats */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Organisation Stats</h2>
          <p className="text-sm text-gray-500 mb-4">Displayed as social proof on your organisation page.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { key: 'total_learners', label: 'Total Learners' },
              { key: 'programmes_completed', label: 'Programmes Completed' },
              { key: 'success_rate', label: 'Success Rate (%)' },
              { key: 'years_experience', label: 'Years Experience' },
            ] as { key: keyof OrgStats; label: string }[]).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type="number" min={0} max={key === 'success_rate' ? 100 : undefined}
                  value={stats[key]}
                  onChange={e => setStats(s => ({ ...s, [key]: parseInt(e.target.value) || 0 }))}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          {statsMsg && <p className={`text-sm mt-3 ${statsMsg.includes('saved') || statsMsg.includes('synced') ? 'text-green-600' : 'text-red-600'}`}>{statsMsg}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={handleSaveStats} disabled={statsSaving} className={btnCls}>{statsSaving ? 'Saving…' : 'Save Stats'}</button>
            <button onClick={handleSyncStats} disabled={statsSyncing} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50">
              {statsSyncing ? 'Syncing…' : 'Sync from Real Data'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Sync calculates total learners and programmes from your actual enrollment data.</p>
        </section>

        {/* Testimonials */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Testimonials</h2>
          <p className="text-sm text-gray-500 mb-4">Learner quotes shown on your organisation page.</p>

          {/* Existing testimonials */}
          {testimonials.length > 0 && (
            <div className="space-y-3 mb-6">
              {testimonials.map(t => (
                <div key={t.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{t.learner_name}</p>
                      {t.programme_name && <p className="text-xs text-gray-500">{t.programme_name}</p>}
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">"{t.quote}"</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                        {t.is_featured && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Featured</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditingTestimonial(t); setTestimonialForm({ learner_name: t.learner_name, learner_avatar: t.learner_avatar, programme_name: t.programme_name, quote: t.quote, rating: t.rating, is_featured: t.is_featured }); }} className={secondaryBtnCls}>Edit</button>
                      <button onClick={() => t.id && handleDeleteTestimonial(t.id)} className={dangerBtnCls}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit form */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Learner name *</label>
                  <input type="text" value={testimonialForm.learner_name} onChange={e => setTestimonialForm(f => ({ ...f, learner_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Programme name</label>
                  <input type="text" value={testimonialForm.programme_name || ''} onChange={e => setTestimonialForm(f => ({ ...f, programme_name: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quote *</label>
                <textarea value={testimonialForm.quote} onChange={e => setTestimonialForm(f => ({ ...f, quote: e.target.value }))} rows={2} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Avatar URL</label>
                <input type="url" value={testimonialForm.learner_avatar || ''} onChange={e => setTestimonialForm(f => ({ ...f, learner_avatar: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rating</label>
                  <select value={testimonialForm.rating} onChange={e => setTestimonialForm(f => ({ ...f, rating: parseInt(e.target.value) }))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 mt-4">
                  <input type="checkbox" checked={testimonialForm.is_featured} onChange={e => setTestimonialForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
                  Featured
                </label>
              </div>
              {testimonialMsg && <p className={`text-sm ${testimonialMsg.includes('Saved') ? 'text-green-600' : 'text-red-600'}`}>{testimonialMsg}</p>}
              <div className="flex gap-2">
                <button onClick={handleSaveTestimonial} disabled={testimonialSaving || !testimonialForm.learner_name || !testimonialForm.quote} className={btnCls}>
                  {testimonialSaving ? 'Saving…' : editingTestimonial ? 'Update' : 'Add'}
                </button>
                {editingTestimonial && (
                  <button onClick={() => { setEditingTestimonial(null); setTestimonialForm({ learner_name: '', quote: '', rating: 5, is_featured: false }); }} className={secondaryBtnCls}>Cancel</button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">FAQs</h2>
          <p className="text-sm text-gray-500 mb-4">Frequently asked questions shown on your organisation page.</p>

          {faqs.length > 0 && (
            <div className="space-y-3 mb-6">
              {faqs.map((f, i) => (
                <div key={f.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{i + 1}. {f.question}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{f.answer}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditingFaq(f); setFaqForm({ question: f.question, answer: f.answer, order_index: f.order_index }); }} className={secondaryBtnCls}>Edit</button>
                      <button onClick={() => f.id && handleDeleteFaq(f.id)} className={dangerBtnCls}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Question *</label>
                <input type="text" value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Answer *</label>
                <textarea value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} rows={3} className={inputCls} />
              </div>
              {faqMsg && <p className={`text-sm ${faqMsg.includes('Saved') ? 'text-green-600' : 'text-red-600'}`}>{faqMsg}</p>}
              <div className="flex gap-2">
                <button onClick={handleSaveFaq} disabled={faqSaving || !faqForm.question || !faqForm.answer} className={btnCls}>
                  {faqSaving ? 'Saving…' : editingFaq ? 'Update' : 'Add'}
                </button>
                {editingFaq && (
                  <button onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '', order_index: 0 }); }} className={secondaryBtnCls}>Cancel</button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Google Drive */}
        <DriveConnectionSection />

        {/* Change Password */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <PasswordChangeForm onSubmit={changePassword} />
        </section>
      </div>
    </div>
  );
}
