'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Download, RefreshCw, QrCode, Loader2 } from 'lucide-react';

interface UserQRCodeProps {
    userId: string;
    userName?: string;
    userRole?: string;
    isAdmin?: boolean;
    size?: number;
    className?: string;
}

import apiClient from '@/lib/api/client';

export default function UserQRCode({ 
    userId, 
    userName, 
    userRole, 
    isAdmin = false,
    size = 220,
    className
}: UserQRCodeProps) {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQR = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get(`/users/${userId}/qr`);
            setQrCode(res.data.qrCode);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load QR code');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchQR(); }, [fetchQR]);

    const handleRegenerate = async () => {
        try {
            setRegenerating(true);
            const res = await apiClient.post(`/users/${userId}/qr/regenerate`);
            setQrCode(res.data.qrCode);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Regeneration failed');
        } finally {
            setRegenerating(false);
        }
    };

    const handleDownload = () => {
        if (!qrCode) return;
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = `QR_${userName?.replace(/\s+/g, '_') || userId}.png`;
        link.click();
    };

    return (
        <div className={`qr-card ${className || ''}`}>
            <div className="qr-card-header">
                <QrCode size={18} />
                <span>Attendance QR Code</span>
            </div>

            <div className="qr-image-wrapper">
                {loading ? (
                    <div className="qr-skeleton">
                        <Loader2 size={28} className="qr-spinner" />
                        <span>Loading QR…</span>
                    </div>
                ) : error ? (
                    <div className="qr-error">
                        <span>{error}</span>
                        <button onClick={fetchQR} className="qr-btn-outline">Retry</button>
                    </div>
                ) : qrCode ? (
                    <Image
                        src={qrCode}
                        alt={`QR Code for ${userName}`}
                        width={size}
                        height={size}
                        className="qr-image"
                        unoptimized
                    />
                ) : null}
            </div>

            {!loading && !error && (
                <div className="qr-meta">
                    <span className="qr-name">{userName}</span>
                    {userRole && <span className="qr-role-badge">{userRole}</span>}
                </div>
            )}

            <div className="qr-actions">
                <button
                    onClick={handleDownload}
                    disabled={!qrCode || loading}
                    className="qr-btn-primary"
                    title="Download QR as PNG"
                >
                    <Download size={15} /> Download
                </button>
                {isAdmin && (
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating || loading}
                        className="qr-btn-outline"
                        title="Generate a new QR code for this user"
                    >
                        {regenerating ? <Loader2 size={15} className="qr-spinner" /> : <RefreshCw size={15} />}
                        Regenerate
                    </button>
                )}
            </div>

            <style jsx>{`
        .qr-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid rgba(15, 82, 186, 0.1);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          width: 280px;
        }
        .qr-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1e293b;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .qr-image-wrapper {
          background: #fff;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 240px;
          height: 240px;
        }
        .qr-image { border-radius: 4px; }
        .qr-skeleton, .qr-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-size: 13px;
        }
        .qr-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .qr-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .qr-name { color: #0f172a; font-weight: 700; font-size: 14px; }
        .qr-role-badge {
          background: rgba(15, 82, 186, 0.1);
          color: #0f52ba;
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .qr-actions {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .qr-btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .qr-btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .qr-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .qr-btn-outline {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          color: #0f52ba;
          border: 1px solid rgba(15, 82, 186, 0.3);
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .qr-btn-outline:hover:not(:disabled) { background: rgba(99,102,241,0.1); }
        .qr-btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
        </div>
    );
}
