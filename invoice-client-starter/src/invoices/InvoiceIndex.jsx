import {useEffect, useState} from "react";

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
    const [filterActive, setFilterActive] = useState(false);

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
            setFilterActive(true);
        } catch (err) {
            alert("Chyba při filtrování: "+err.message);
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

    const clearFilters = async () => {
        setFilters({
            buyerId: '',
            sellerId: '',
            product: '',
            minPrice: '',
            maxPrice: '',
            limit: ''
        });
        setFilterActive(false);
        const data = await apiGet("/api/invoices");
        setInvoices(data);
    };

    return (
        <div>
            {/* <button className="btn btn-outline-primary mb-3" onClick={() => setShowFilter(true)}>
                Filtruj faktury
            </button> */}

            <div className="d-flex mb-3 gap-2">
                <button className="btn btn-primary" onClick={() => setShowFilter(true)}>
                    {filterActive ? "Filtrováno 🔍" : "Filtruj faktury"}
                </button>

                {filterActive && (
                    <button className="btn btn-outline-secondary" onClick={clearFilters}>
                        Zrušit filtr
                    </button>
                )}
                </div>


            {showFilter && (
                <InvoiceFilterModal
                    key={Date.now()}
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
                    setShowFilter={setShowFilter}
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
