"use client";

import { Modal } from "@/components/ui/Modal/Modal";
import { useBooking } from "@/stores/booking";
import { useCart } from "@/stores/cart";

import { PickerBody } from "./PickerBody";

/** The pickup date & slot dialog. Mounted once in the layout; opened from the pickup bar or the first add-to-cart. */
export function PickupPicker() {
  const isOpen = useBooking((s) => s.isPickerOpen);
  const closePicker = useBooking((s) => s.closePicker);
  const setPendingItem = useCart((s) => s.setPendingItem);

  const close = () => {
    setPendingItem(null);
    closePicker();
  };

  return (
    <Modal open={isOpen} onClose={close} title="מתי לאסוף?">
      {/* Mounted only while open, so every opening starts from the current saved choice. */}
      {isOpen && <PickerBody onDone={closePicker} />}
    </Modal>
  );
}
