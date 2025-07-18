"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ModalContainer } from "../modal-container";

// Define the modal options interface
interface ModalOptions {
   overlay?: boolean;
}

interface ModalContextType {
   showModal: (content: ReactNode, options?: ModalOptions) => void;
   hideModal: () => void;
   isOpen: boolean;
   modal: ReactNode | null;
   modalOptions: ModalOptions | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
   const [isOpen, setIsOpen] = useState(false);
   const [modal, setModal] = useState<ReactNode | null>(null);
   const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

   const showModal = (content: ReactNode, options?: ModalOptions) => {
      setModal(content);
      setModalOptions(options || {});
      setIsOpen(true);
   };

   const hideModal = () => {
      setIsOpen(false);
      setModal(null);
      setModalOptions(null);
   };

   return (
      <ModalContext.Provider value={{ showModal, hideModal, isOpen, modal, modalOptions }}>
         <ModalContainer />
         {children}
      </ModalContext.Provider>
   );
}

export const useModal = () => {
   const context = useContext(ModalContext);
   if (context === undefined) {
      throw new Error("useModal must be used within a ModalProvider");
   }
   return context;
};
