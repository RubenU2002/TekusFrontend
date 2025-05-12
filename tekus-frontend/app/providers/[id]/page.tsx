'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { z } from 'zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Country, Provider } from '@/lib/types';

// Mismo schema que el formulario de creación, pero permitimos editar la mayoría de campos
const ServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  hourlyRate: z.coerce.number().positive('Hourly rate must be positive'),
  countryCodes: z.array(z.string()).min(1, 'At least one country is required'),
  id: z.string().optional(), // Para servicios existentes
});

const AttributeSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  id: z.string().optional(), // Para atributos existentes
});

const ProviderSchema = z.object({
  id: z.string(), // Requerido para edición
  nit: z.string(), // Ya no tiene validación min(1) porque no se puede editar
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  services: z.array(ServiceSchema),
  attributes: z.array(AttributeSchema),
});

type ProviderFormData = z.infer<typeof ProviderSchema>;

export default function EditProviderPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(ProviderSchema),
    defaultValues: {
      id: '',
      nit: '',
      name: '',
      email: '',
      services: [{ name: '', hourlyRate: 0, countryCodes: [] }],
      attributes: [{ key: '', value: '' }],
    },
  });

  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
  } = useFieldArray({ control, name: 'services' });

  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({ control, name: 'attributes' });

  // Carga los datos del proveedor
  useEffect(() => {
    const fetchProvider = async () => {
      setIsLoadingProvider(true);
      try {
        const response = await api.get(`/Provider/${providerId}`);
        const provider = response.data as Provider;
        
        // Transformar los datos del formato de la API al formato del formulario
        const formData = {
          id: provider.id,
          nit: provider.nit,
          name: provider.name,
          email: provider.email,
          services: provider.services.map(service => ({
            id: service.id,
            name: service.name,
            hourlyRate: service.hourlyRate,
            countryCodes: service.countries.map(c => c.countryCode),
          })),
          attributes: provider.customAttributes.map(attr => ({
            id: attr.id,
            key: attr.key,
            value: attr.value,
          })),
        };
        
        // Reset con los datos obtenidos
        reset(formData);
      } catch (error) {
        console.error('Error fetching provider:', error);
        setError('Error loading provider data');
      } finally {
        setIsLoadingProvider(false);
      }
    };

    fetchProvider();
  }, [providerId, reset]);

  // Carga los países
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await api.get('/Country');
        setCountries(response.data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const onSubmit = async (data: ProviderFormData) => {
    setIsLoading(true);
    setError('');

    try {
      await api.put(`/Provider/${providerId}`, {
        id: providerId,
        name: data.name,
        email: data.email,
        services: data.services.map(service => ({
          name: service.name,
          hourlyRate: service.hourlyRate,
          countryCodes: service.countryCodes,
        })),
        attributes: data.attributes.map(attr => ({
          key: attr.key,
          value: attr.value,
        })),
      });
      
      router.push('/providers');
    } catch (error: any) {
      console.error('Failed to update provider:', error);
      setError(error.response?.data?.message || 'Failed to update provider');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProvider) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Edit Provider</h1>
        <Link
          href="/providers"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-md rounded-lg p-6 border border-gray-200"
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Provider Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIT
              </label>
              <input
                type="text"
                {...register("nit")}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                disabled 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Services</h2>
            <button
              type="button"
              onClick={() =>
                appendService({ name: "", hourlyRate: 0, countryCodes: [] })
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Add Service
            </button>
          </div>

          {serviceFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-gray-50 p-4 rounded mb-4 border border-gray-200"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Service #{index + 1}</h3>
                {serviceFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    {...register(`services.${index}.name`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  {errors.services?.[index]?.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.services[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`services.${index}.hourlyRate`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  {errors.services?.[index]?.hourlyRate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.services[index]?.hourlyRate?.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Countries
                </label>
                {isLoadingCountries ? (
                  <div className="text-gray-500 text-sm">
                    Loading countries...
                  </div>
                ) : (
                  <Controller
                    control={control}
                    name={`services.${index}.countryCodes`}
                    render={({ field }) => {
                      const [isOpen, setIsOpen] = useState(false);
                      const [searchTerm, setSearchTerm] = useState("");

                      const filteredCountries = searchTerm
                        ? countries.filter((country) =>
                            country.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          )
                        : countries;
                      return (
                        <div className="relative">
                          <div
                            onClick={() => setIsOpen(!isOpen)}
                            className="min-h-[42px] flex flex-wrap gap-2 p-2 border border-gray-300 rounded cursor-pointer"
                          >
                            {field.value.length === 0 && (
                              <span className="text-gray-400 py-1">
                                Select countries...
                              </span>
                            )}

                            {field.value.map((code) => {
                              const country = countries.find(
                                (c) => c.code.trim() === code.trim()
                              );
                              return (
                                <span
                                  key={code}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center text-sm"
                                >
                                  {country?.name || code}
                                  <button
                                    type="button"
                                    className="ml-1 text-blue-800 hover:text-blue-950 font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      field.onChange(
                                        field.value.filter((v) => v !== code)
                                      );
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                          {isOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                                <input
                                  type="text"
                                  placeholder="Search countries..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  value={searchTerm}
                                />
                              </div>

                              {filteredCountries.map((country) => {
                                if (field.value.includes(country.code))
                                  return null;

                                return (
                                  <div
                                    key={country.code}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      field.onChange([
                                        ...field.value,
                                        country.code,
                                      ]);
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <span>{country.name}</span>
                                      <span className="ml-1 text-gray-500 text-xs">
                                        ({country.code})
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                )}
                {errors.services?.[index]?.countryCodes && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.services[index]?.countryCodes?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Attributes */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Custom Attributes</h2>
            <button
              type="button"
              onClick={() => appendAttribute({ key: "", value: "" })}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Add Attribute
            </button>
          </div>

          {attributeFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-gray-50 p-4 rounded mb-4 border border-gray-200"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Attribute #{index + 1}</h3>
                {attributeFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key
                  </label>
                  <input
                    type="text"
                    {...register(`attributes.${index}.key`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  {errors.attributes?.[index]?.key && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.attributes[index]?.key?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    {...register(`attributes.${index}.value`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  {errors.attributes?.[index]?.value && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.attributes[index]?.value?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Provider"}
          </button>
        </div>
      </form>
    </div>
  );
}