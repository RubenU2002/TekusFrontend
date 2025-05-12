'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Provider, PaginatedResponse, Country } from '@/lib/types';

export default function ProvidersPage() {
  const [providerData, setProviderData] = useState<PaginatedResponse<Provider>>({
    items: [],
    pageNumber: 1,
    totalPages: 1,
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const getCountryName = (countryCode: string) => {
    countryCode = countryCode.toUpperCase().trim();
    const country = countries.find(c => c.code == countryCode);
    return country ? country.name : countryCode;
  };
  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/Provider', {
          params: { pageNumber: currentPage, pageSize: 2 }
        });
        setProviderData(response.data);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await api.get("/Country");
        setCountries(response.data);
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
    fetchProviders();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Providers</h1>
        <Link 
          href="/providers/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Provider
        </Link>
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Providers</h1>
        <Link 
          href="/summary" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          View Summary
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {providerData.items.map((provider) => (
          <div key={provider.id} className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{provider.name}</h2>
                <p className="text-gray-600">{provider.email}</p>
                <p className="text-sm text-gray-500">NIT: {provider.nit}</p>
                <p className="text-sm text-gray-500">Created: {new Date(provider.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <Link 
                  href={`/providers/${provider.id}`}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                >
                  Edit
                </Link>
              </div>
            </div>

            {provider.services.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">Services</h3>
                <div className="space-y-3">
                  {provider.services.map(service => (
                    <div key={service.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-green-600">${service.hourlyRate}/hr</span>
                      </div>
                      {service.countries.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {service.countries.map(country => (
                            <span 
                              key={country.id} 
                              className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {getCountryName(country.countryCode)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {provider.customAttributes.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">Custom Attributes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {provider.customAttributes.map(attr => (
                    <div key={attr.id} className="bg-gray-50 p-2 rounded text-sm">
                      <span className="font-medium">{attr.key}:</span> {attr.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {providerData.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!providerData.hasPreviousPage}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm">
              Page {providerData.pageNumber} of {providerData.totalPages}
            </span>
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!providerData.hasNextPage}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}