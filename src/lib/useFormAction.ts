"use client";

import { useActionState, useTransition } from "react";
import type { FormEvent } from "react";

export type FormState =
  | { error?: string; fieldErrors?: Record<string, string>; ok?: boolean }
  | undefined;

/**
 * Envía un formulario a una server action con onSubmit (no `action=`), para que React 19
 * no vacíe los campos tras un error de validación.
 */
export function useFormAction(
  action: (prev: FormState, fd: FormData) => Promise<FormState>,
  onOk?: () => void,
) {
  const [submitting, startTransition] = useTransition();
  const [state, dispatch, actionPending] = useActionState(
    async (prev: FormState, fd: FormData) => {
      const res = await action(prev, fd);
      if (res?.ok) onOk?.();
      return res;
    },
    undefined,
  );
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { state, onSubmit, pending: actionPending || submitting };
}
