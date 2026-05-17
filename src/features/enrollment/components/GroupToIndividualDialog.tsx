'use client';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GroupToIndividualDialog({ open, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-semibold text-zinc-900 mb-2">단체 신청 정보 삭제</h3>
        <p className="text-sm text-zinc-600 mb-6">
          단체 신청 정보가 모두 삭제됩니다. 계속하시겠습니까?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 border border-zinc-300 hover:bg-zinc-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
