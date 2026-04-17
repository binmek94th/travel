"use client";
import { useState } from "react";
import { Card, CardHeader, FormField, inputCls, selectCls, Btn } from "@/src/components/admin/ui";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const Section = ({ title, subtitle, children }: { title:string; subtitle?:string; children:React.ReactNode }) => (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="p-5"><div className="flex flex-col gap-4">{children}</div></div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-light text-slate-800" style={{fontFamily:"'Playfair Display',serif"}}>Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Platform configuration and integrations</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>
              Saved
            </span>
          )}
          <Btn variant="primary" size="sm" onClick={handleSave}>Save all changes</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        <Section title="General" subtitle="Basic platform settings">
          <FormField label="Platform name"><input className={inputCls} defaultValue="Tizitaw Ethiopia" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Default currency">
              <select className={selectCls}><option value="USD">USD — US Dollar</option><option value="ETB">ETB — Ethiopian Birr</option></select>
            </FormField>
            <FormField label="Default language">
              <select className={selectCls}><option value="en">English</option><option value="am">Amharic</option></select>
            </FormField>
          </div>
          <FormField label="Support email"><input className={inputCls} defaultValue="support@tizitaw.et" type="email" /></FormField>
        </Section>

        <Section title="Payments" subtitle="Stripe & Chapa configuration">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Stripe (International)</p>
          <FormField label="Publishable key"><input className={inputCls} defaultValue="pk_live_••••••••" /></FormField>
          <FormField label="Webhook secret"><input className={inputCls} defaultValue="whsec_••••••••" type="password" /></FormField>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mt-2">Chapa (Ethiopia local)</p>
          <FormField label="Secret key"><input className={inputCls} defaultValue="CHASECK_••••••" type="password" /></FormField>
          <FormField label="Platform commission (%)"><input className={inputCls} defaultValue="12" type="number" min="0" max="50" /></FormField>
        </Section>

        <Section title="AI Journey Builder" subtitle="Anthropic API configuration">
          <FormField label="API key"><input className={inputCls} defaultValue="sk-ant-••••••" type="password" /></FormField>
          <FormField label="Model">
            <select className={selectCls}>
              <option value="claude-sonnet-4-5">claude-sonnet-4-5 (recommended)</option>
              <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (faster)</option>
            </select>
          </FormField>
          <FormField label="Max tokens per itinerary"><input className={inputCls} defaultValue="4000" type="number" /></FormField>
          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-cyan-600" />
            Enable AI journey builder for users
          </label>
        </Section>

        <Section title="Search" subtitle="Algolia configuration">
          <FormField label="Application ID"><input className={inputCls} defaultValue="XXXXXXXXXX" /></FormField>
          <FormField label="Search-only API key"><input className={inputCls} defaultValue="••••••••••••••••" type="password" /></FormField>
          <FormField label="Admin API key"><input className={inputCls} defaultValue="••••••••••••••••" type="password" /></FormField>
          <div className="flex gap-2 pt-1">
            <Btn variant="secondary" size="sm">Sync destinations</Btn>
            <Btn variant="secondary" size="sm">Sync tours</Btn>
          </div>
        </Section>

        <Section title="Media & Storage" subtitle="Cloudinary configuration">
          <FormField label="Cloud name"><input className={inputCls} defaultValue="tizitaw-ethiopia" /></FormField>
          <FormField label="API key"><input className={inputCls} defaultValue="••••••••" type="password" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Max image size (MB)"><input className={inputCls} defaultValue="10" type="number" /></FormField>
            <FormField label="Max video size (MB)"><input className={inputCls} defaultValue="200" type="number" /></FormField>
          </div>
        </Section>

        <Section title="SEO & Meta" subtitle="Default metadata and Maps">
          <FormField label="Default meta title"><input className={inputCls} defaultValue="Tizitaw Ethiopia — Discover Africa's Oldest Civilization" /></FormField>
          <FormField label="Default meta description">
            <textarea className={`${inputCls} min-h-[72px] resize-y`}
              defaultValue="Explore Ethiopia's breathtaking landscapes, ancient history, and vibrant culture." />
          </FormField>
          <FormField label="Google Maps API key"><input className={inputCls} defaultValue="AIza••••••••••••••" type="password" /></FormField>
        </Section>

      </div>
    </div>
  );
}
