import { createContext, useContext, useState, type ReactNode, type FC } from 'react';
import { createPortal } from 'react-dom';

interface ModalContextProps {
    open: (content: ReactNode) => void;
    close: () => void;
}

interface ModalProviderProps {
    children: ReactNode;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: FC<ModalProviderProps> = ({ children }) => {
    const [content, setContent] = useState<ReactNode | null>(null);

    const open = (node: ReactNode) => setContent(node);
    const close = () => setContent(null);

    return (
        <ModalContext.Provider value={{ open, close }}>
            {children}
            {/* TODO: подумай над стилями */}
            {content && createPortal(
                <div className="modal-overlay" onClick={close}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {content}
                    </div>
                </div>,
                document.body
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};