import React, { useEffect, useState } from "react";
import { apiGet } from "../../utils/api";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

const StatisticsPage = () => {
    const [invoiceStats, setInvoiceStats] = useState(null);
    const [personStats, setPersonStats] = useState([]);

    useEffect(() => {
        apiGet("/api/invoices/statistics").then((data) => setInvoiceStats(data));
        apiGet("/api/persons/statistics").then((data) => {
            const cleaned = data.map(p => ({
                ...p,
                revenue: Number(p.revenue)
            }));
            setPersonStats(cleaned);
        });
    }, []);

    return (
        <div className="container">
            <h2>📊 Statistika</h2>

            {invoiceStats && (
                <div className="mb-4">
                    <h4>Souhrn faktur</h4>
                    <ul>
                        <li>Součet za aktuální rok: {invoiceStats.currentYearSum} Kč</li>
                        <li>Celkový součet: {invoiceStats.allTimeSum} Kč</li>
                        <li>Počet faktur: {invoiceStats.invoicesCount}</li>
                    </ul>
                </div>
            )}

            {personStats.length > 0 && (
                <div>
                    <h4>Výnosy podle osob</h4>
                    <>
                        <h4 className="mt-4">📊 Výnosy podle osob</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                layout="vertical"
                                data={personStats}
                                margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="personName" />
                                <Tooltip formatter={(value) => `${value} Kč`} />
                                <Bar dataKey="revenue" fill="#0d6efd" label={{ position: "right" }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </>
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;
