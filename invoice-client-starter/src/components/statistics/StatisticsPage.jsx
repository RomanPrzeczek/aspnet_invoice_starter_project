import React, { useEffect, useState } from "react";
import { apiGet } from "../../utils/api";
// import axios from "axios";

const StatisticsPage = () => {
    const [invoiceStats, setInvoiceStats] = useState(null);
    const [personStats, setPersonStats] = useState([]);

/*    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const [invoiceRes, personRes] = await Promise.all([
                    axios.get("http://localhost:7071/api/invoices/statistics"),
                    axios.get("http://localhost:7071/api/persons/statistics"),
                ]);

                setInvoiceStats(invoiceRes.data);
                setPersonStats(personRes.data);
            } catch (error) {
                console.error("Chyba při načítání statistik:", error);
            }
        };
        fetchStatistics();
    }, []);
*/
    useEffect(() => {
        apiGet("/api/invoices/statistics").then((data) => setInvoiceStats(data));
        apiGet("/api/persons/statistics").then((data) => setPersonStats(data));
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
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Jméno</th>
                                <th>Výnos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personStats.map((p, index) => (
                                <tr key={p.personId}>
                                    <td>{index + 1}</td>
                                    <td>{p.personName}</td>
                                    <td>{p.revenue} Kč</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;
