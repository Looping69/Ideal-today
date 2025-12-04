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
}

export interface YocoPopupOptions {
    amountInCents: number;
    currency: 'ZAR';
    name?: string;
    description?: string;
    image?: string;
    callback: (result: YocoResult) => void;
}

export interface YocoResult {
    id: string; // The token ID
    error?: {
        message: string;
    };
}
