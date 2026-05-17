'use client';

import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TERMS_SECTIONS = [
  {
    title: '제1조 (목적)',
    body: '본 약관은 온라인 교육 플랫폼(이하 "플랫폼")이 제공하는 수강 신청 서비스의 이용 조건 및 절차, 플랫폼과 이용자의 권리·의무를 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (개인정보 수집 및 이용)',
    body: '플랫폼은 수강 신청을 위해 이름, 이메일, 전화번호 등 최소한의 개인정보를 수집하며, 해당 정보는 수강 신청 처리 및 안내 목적으로만 사용됩니다. 수집된 개인정보는 관련 법령에 따라 안전하게 보호됩니다.',
  },
  {
    title: '제3조 (수강 신청 및 취소)',
    body: '수강 신청은 정원 내에서만 가능하며, 정원 초과 시 신청이 거부될 수 있습니다. 신청 취소는 강의 시작 7일 전까지 가능하며, 이후 취소 시 환불 정책에 따릅니다.',
  },
  {
    title: '제4조 (환불 정책)',
    body: '강의 시작 7일 전까지 취소 시 전액 환불, 3~6일 전 취소 시 50% 환불, 2일 이내 취소 또는 무단 불참 시 환불이 불가합니다.',
  },
  {
    title: '제5조 (단체 신청)',
    body: '단체 신청 시 대표 신청자가 참가자 전원의 동의를 받아 신청해야 하며, 참가자 개인정보 제공에 대한 책임은 대표 신청자에게 있습니다.',
  },
  {
    title: '제6조 (면책 조항)',
    body: '플랫폼은 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다. 단, 플랫폼 귀책 사유로 인한 피해에 대해서는 관련 법령에 따라 보상합니다.',
  },
];

export function TermsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-xl shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">이용약관</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="닫기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-4 space-y-5 text-sm text-zinc-700">
          {TERMS_SECTIONS.map(({ title, body }) => (
            <div key={title}>
              <p className="font-semibold text-zinc-900 mb-1">{title}</p>
              <p className="leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
