export { };

declare global {
    interface Window {
        YocoSDK: {
            new(options: { publicKey: string }): YocoInstance;
        };
    }
}

export interface YocoInstance {
    showPopup: (options: YocoPopupOptions) => void;
    inline: (options: YocoInlineOptions) => YocoInlineForm;
}

export interface YocoPopupOptions {
    amountInCents: number;
    currency: 'ZAR';
    name?: string;
    description?: string;
    image?: string;
    callback: (result: YocoResult) => void;
}

export interface YocoInlineOptions {
    layout?: 'field' | 'plain';
    amountInCents?: number;
    currency?: 'ZAR';
}

export interface YocoInlineForm {
    mount: (container: HTMLElement) => void;
    unmount: () => void;
    submit: () => Promise<YocoResult>;
}

export interface YocoResult {
    id: string; // The token ID
    error?: {
        message: string;
    };
}

