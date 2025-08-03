import {useEffect, useState} from "react";
import {apiDelete, apiGet} from "../utils/api";
import { useTranslation } from "react-i18next";

import InvoiceTable from "./InvoiceTable";
import InvoiceFilterBar from "../components/InvoiceFilterBar";

const InvoiceIndex = () => {
    const {t} = useTranslation();
    const [invoices, setInvoices] = useState([]);
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
        fetchInvoices();
        apiGet("/api/persons").then((data) => setPersons(data));
    }, []);

    /// <summary>
    /// Handles query params for BE filtering.
    /// </summary>
    const fetchInvoices = async () => {
    let query = [];

    if (filters.buyerId) query.push(`buyerId=${filters.buyerId}`);
    if (filters.sellerId) query.push(`sellerId=${filters.sellerId}`);
    if (filters.product) query.push(`product=${filters.product}`);
    if (filters.minPrice) query.push(`minPrice=${filters.minPrice}`);
    if (filters.maxPrice) query.push(`maxPrice=${filters.maxPrice}`);
    if (filters.limit) query.push(`limit=${filters.limit}`);

    const queryString = query.length > 0 ? `?${query.join("&")}` : "";

    const data = await apiGet(`/api/invoices${queryString}`);
    setInvoices(data);
    setFilterActive(query.length > 0);
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
            <InvoiceFilterBar 
                filters={filters}
                setFilters={setFilters}
                persons={persons}
                onApply={fetchInvoices}
                onClear={clearFilters}
                filterActive={filterActive}
            />

            <h1> {t('InvoicesList')} </h1>
            <InvoiceTable
                deleteInvoice={deleteInvoice}
                items={invoices}
                label={t('InvoicesCount')+": "}
            />
        </div>
    )
};
export default InvoiceIndex;
