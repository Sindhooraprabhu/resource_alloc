import React from 'react';
import { Link } from 'react-router-dom';

const DashboardLayout = ({ title, subtitle, breadcrumbs = [], actions, children }) => {
    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto px-4">
                <div className="rounded-[32px] border border-border/50 bg-surface p-6 shadow-soft">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-3">
                                {breadcrumbs.map((crumb, index) => (
                                    <span key={index} className="inline-flex items-center gap-2">
                                        {crumb.href ? (
                                            <Link to={crumb.href} className="hover:text-primary transition-colors">{crumb.label}</Link>
                                        ) : (
                                            <span>{crumb.label}</span>
                                        )}
                                        {index < breadcrumbs.length - 1 && <span className="text-text-tertiary">/</span>}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
                            <p className="mt-2 text-base text-text-secondary max-w-2xl">{subtitle}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <Link to="/emergency" className="btn-outline px-4 py-2 text-sm">
                                User Portal
                            </Link>
                            {actions && actions}
                        </div>
                    </div>
                </div>

                <div className="mt-8">{children}</div>
            </div>
        </div>
    );
};

export default DashboardLayout;
