/*  _____ _______         _                      _
 * |_   _|__   __|       | |                    | |
 *   | |    | |_ __   ___| |___      _____  _ __| | __  ___ ____
 *   | |    | | '_ \ / _ \ __\ \ /\ / / _ \| '__| |/ / / __|_  /
 *  _| |_   | | | | |  __/ |_ \ V  V / (_) | |  |   < | (__ / /
 * |_____|  |_|_| |_|\___|\__| \_/\_/ \___/|_|  |_|\_(_)___/___|
 *                                _
 *              ___ ___ ___ _____|_|_ _ _____
 *             | . |  _| -_|     | | | |     |  LICENCE
 *             |  _|_| |___|_|_|_|_|___|_|_|_|
 *             |_|
 *
 *   PROGRAMOVÁNÍ  <>  DESIGN  <>  PRÁCE/PODNIKÁNÍ  <>  HW A SW
 *
 * Tento zdrojový kód je součástí výukových seriálů na
 * IT sociální síti WWW.ITNETWORK.CZ
 *
 * Kód spadá pod licenci prémiového obsahu a vznikl díky podpoře
 * našich členů. Je určen pouze pro osobní užití a nesmí být šířen.
 * Více informací na http://www.itnetwork.cz/licence
 */

import React, {useEffect, useState} from "react";

import {apiDelete, apiGet} from "../utils/api";

import InvoiceTable from "./InvoiceTable";
import InvoiceFilterModal from "../components/InvoiceFilterModal";

const InvoiceIndex = () => {
    const [invoices, setInvoices] = useState([]);
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({
        buyerId: '',
        sellerId: '',
        product: '',
        minPrice: '',
        maxPrice: '',
        limit: ''
    });
    const [persons, setPersons] = useState([]);

    useEffect(() => {
        apiGet("/api/invoices").then((data) => setInvoices(data));
        apiGet("/api/persons").then((data) => setPersons(data));
    }, []);

    /// <summary>
    /// Handles query params for BE filtering.
    /// </summary>
    const handleApplyFilter = async () => {
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
            if (val !== '') {
                query.append(key, val);
            }
        });

        try {
            const data = await apiGet(`/api/invoices?${query.toString()}`);
            setInvoices(data);
        } catch (err) {
            alert("Chyba při filtrování.");
        }
    };

    const deleteInvoice = async (id) => {
        try {
            await apiDelete("/api/invoices/" + id);
        } catch (error) {
            console.log(error.message);
            alert(error.message)
        }
        setInvoices(invoices.filter((item) => item._id !== id));
    };

    return (
        <div>
            <button className="btn btn-outline-primary mb-3" onClick={() => setShowFilter(true)}>
                Filtruj faktury
            </button>

            {showFilter && (
                <InvoiceFilterModal
                    filters={filters}
                    setFilters={setFilters}
                    persons={persons}
                    onApply={() => {
                        handleApplyFilter();
                        setShowFilter(false);
                        document.body.classList.remove('modal-open');
                        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                    }}
                    onReset={() => {
                        setFilters({
                            buyerId: '',
                            sellerId: '',
                            product: '',
                            minPrice: '',
                            maxPrice: '',
                            limit: ''
                        });

                        apiGet("/api/invoices").then(data => setInvoices(data));

                        setShowFilter(false);
                        document.body.classList.remove('modal-open');
                        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                    }}
                />
            )}

            <h1>Seznam faktur</h1>
            <InvoiceTable
                deleteInvoice={deleteInvoice}
                items={invoices}
                label="Počet faktur:"
            />
        </div>
    )
};
export default InvoiceIndex;
