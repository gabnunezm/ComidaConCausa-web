"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Plus,
  Search,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Navigation,
  Star,
  Award,
  TrendingUp,
  ArrowLeft,
  MapPin,
  Trash2,
  Edit,
  Heart,
  Users,
  Shield,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Location {
  lat: number
  lng: number
  address: string
}

interface User {
  id: string
  name: string
  email: string
  phone: string
  password: string
  address: string
  location?: Location
  userType: "donante" | "beneficiario" | "administrador"
  businessName?: string
  rnc?: string
  rating?: number
  totalDonations?: number
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

interface FoodPublication {
  id: string
  donorId: string
  donorName: string
  donorBusiness?: string
  foodName: string
  quantity: number
  unit: string
  condition: string
  expirationDate?: string
  location: string
  coordinates?: Location
  photo?: string
  description?: string
  createdAt: string
  status: "available" | "reserved" | "completed"
  distance?: number
}

interface PickupRequest {
  id: string
  publicationId: string
  beneficiaryId: string
  beneficiaryName: string
  beneficiaryPhone: string
  donorId: string
  pickupDate: string
  pickupTime: string
  notes?: string
  status: "pendiente" | "en-camino" | "entregado"
  createdAt: string
}

interface Event {
  id: string
  creatorId: string
  creatorName: string
  name: string
  location: string
  coordinates?: Location
  description: string
  date: string
  time: string
  photo?: string
  createdAt: string
  attendees?: string[]
  organizerId?: string
  organizerName?: string
}

interface Rating {
  id: string
  donorId: string
  beneficiaryId: string
  stars: number
  comment?: string
  createdAt: string
}

const storage = {
  getUsers: (): User[] => {
    const users = localStorage.getItem("comida-usuarios")
    return users ? JSON.parse(users) : []
  },
  saveUser: (user: User) => {
    const users = storage.getUsers()
    const existingIndex = users.findIndex((u) => u.id === user.id)
    if (existingIndex >= 0) {
      users[existingIndex] = user
    } else {
      users.push(user)
    }
    localStorage.setItem("comida-usuarios", JSON.stringify(users))
  },
  getFoodPublications: (): FoodPublication[] => {
    const publications = localStorage.getItem("comida-publicaciones")
    return publications ? JSON.parse(publications) : []
  },
  saveFoodPublication: (publication: FoodPublication) => {
    const publications = storage.getFoodPublications()
    const existingIndex = publications.findIndex((p) => p.id === publication.id)
    if (existingIndex >= 0) {
      publications[existingIndex] = publication
    } else {
      publications.push(publication)
    }
    localStorage.setItem("comida-publicaciones", JSON.stringify(publications))
  },
  deleteFoodPublication: (id: string) => {
    const publications = storage.getFoodPublications().filter((p) => p.id !== id)
    localStorage.setItem("comida-publicaciones", JSON.stringify(publications))
  },
  getPickupRequests: (): PickupRequest[] => {
    const requests = localStorage.getItem("comida-solicitudes")
    return requests ? JSON.parse(requests) : []
  },
  savePickupRequest: (request: PickupRequest) => {
    const requests = storage.getPickupRequests()
    const existingIndex = requests.findIndex((r) => r.id === request.id)
    if (existingIndex >= 0) {
      requests[existingIndex] = request
    } else {
      requests.push(request)
    }
    localStorage.setItem("comida-solicitudes", JSON.stringify(requests))
  },
  getEvents: (): Event[] => {
    const events = localStorage.getItem("comida-eventos")
    return events ? JSON.parse(events) : []
  },
  saveEvent: (event: Event) => {
    const events = storage.getEvents()
    const existingIndex = events.findIndex((e) => e.id === event.id)
    if (existingIndex >= 0) {
      events[existingIndex] = event
    } else {
      events.push(event)
    }
    localStorage.setItem("comida-eventos", JSON.stringify(events))
  },
  deleteEvent: (id: string) => {
    const events = storage.getEvents().filter((e) => e.id !== id)
    localStorage.setItem("comida-eventos", JSON.stringify(events))
  },
  saveFoodPublications: (publications: FoodPublication[]) => {
    localStorage.setItem("comida-publicaciones", JSON.stringify(publications))
  },
  savePickupRequests: (requests: PickupRequest[]) => {
    localStorage.setItem("comida-solicitudes", JSON.stringify(requests))
  },
  saveEvents: (events: Event[]) => {
    localStorage.setItem("comida-eventos", JSON.stringify(events))
  },
  getRatings: (): Rating[] => {
    const ratings = localStorage.getItem("comida-calificaciones")
    return ratings ? JSON.parse(ratings) : []
  },
  saveRatings: (ratings: Rating[]) => {
    localStorage.setItem("comida-calificaciones", JSON.stringify(ratings))
  },
}

const locationUtils = {
  getCurrentLocation: (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Ubicación actual",
          })
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      )
    })
  },

  calculateDistance: (loc1: Location, loc2: Location): number => {
    const R = 6371 // Earth's radius in km
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  geocodeAddress: async (address: string): Promise<Location | null> => {
    try {
      // Using Nominatim (OpenStreetMap) geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
          address: data[0].display_name,
        }
      }
      return null
    } catch (error) {
      console.error("Geocoding error:", error)
      return null
    }
  },
}

const calculateAverageRating = (donorId: string): number => {
  const ratings = storage.getRatings().filter((r) => r.donorId === donorId)
  if (ratings.length === 0) return 5.0
  const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0)
  return sum / ratings.length
}

export default function ComidaConCausa() {
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null })
  const [currentView, setCurrentView] = useState<
    | "home"
    | "login"
    | "register"
    | "publish-food"
    | "browse-food"
    | "my-publications"
    | "pickup-requests"
    | "my-requests"
    | "events"
    | "create-event"
    | "my-events"
    | "admin"
    | "history"
  >("home")

  const [foodPublications, setFoodPublications] = useState<FoodPublication[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    userType: "",
    businessName: "",
    rnc: "",
  })

  const [foodFormData, setFoodFormData] = useState({
    foodName: "",
    quantity: "",
    unit: "kg",
    condition: "nuevo",
    expirationDate: "",
    location: "",
    coordinates: null as Location | null,
    photo: "",
    description: "",
  })

  const [eventFormData, setEventFormData] = useState({
    name: "",
    location: "",
    coordinates: null as Location | null,
    description: "",
    date: "",
    time: "",
    photo: "",
  })

  const [searchFilters, setSearchFilters] = useState({
    keyword: "",
    maxDistance: 10,
    condition: "",
    sortBy: "date",
  })

  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [showPickupDialog, setShowPickupDialog] = useState(false)
  const [selectedPublication, setSelectedPublication] = useState<FoodPublication | null>(null)
  const [pickupFormData, setPickupFormData] = useState({
    pickupDate: "",
    pickupTime: "",
    notes: "",
  })
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
  })

  useEffect(() => {
    if (editingEvent) {
      setEventData({
        name: editingEvent.name,
        description: editingEvent.description,
        date: editingEvent.date,
        time: editingEvent.time,
        location: editingEvent.location,
      })
    } else {
      setEventData({
        name: "",
        description: "",
        date: "",
        time: "",
        location: "",
      })
    }
  }, [editingEvent])

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        setIsLoadingLocation(true)
        const location = await locationUtils.getCurrentLocation()
        setUserLocation(location)
      } catch (error) {
        console.log("Could not get user location:", error)
      } finally {
        setIsLoadingLocation(false)
      }
    }

    getUserLocation()
  }, [])

  // Check authentication on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("comida-auth")
    if (savedAuth) {
      const auth = JSON.parse(savedAuth)
      setAuthState(auth)
    }

    setFoodPublications(storage.getFoodPublications())
    setEvents(storage.getEvents())
    setPickupRequests(storage.getPickupRequests())
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = () => {
    const users = storage.getUsers()
    const user = users.find((u) => u.email === formData.email && u.password === formData.password)

    if (user) {
      const authData = { isAuthenticated: true, user }
      setAuthState(authData)
      localStorage.setItem("comida-auth", JSON.stringify(authData))
      setCurrentView("home")
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        userType: "",
        businessName: "",
        rnc: "",
      })
    } else {
      alert("Credenciales incorrectas")
    }
  }

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.userType) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    const users = storage.getUsers()
    if (users.some((u) => u.email === formData.email)) {
      alert("Ya existe un usuario con este email")
      return
    }

    let userCoordinates: Location | null = null
    if (formData.address) {
      userCoordinates = await locationUtils.geocodeAddress(formData.address)
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      address: formData.address,
      location: userCoordinates || undefined,
      userType: formData.userType as "donante" | "beneficiario" | "administrador",
      businessName: formData.businessName || undefined,
      rnc: formData.rnc || undefined,
      rating: 5.0,
      totalDonations: 0,
    }

    storage.saveUser(newUser)

    const authData = { isAuthenticated: true, user: newUser }
    setAuthState(authData)
    localStorage.setItem("comida-auth", JSON.stringify(authData))
    setCurrentView("home")
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      address: "",
      userType: "",
      businessName: "",
      rnc: "",
    })
  }

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, user: null })
    localStorage.removeItem("comida-auth")
    setCurrentView("home")
  }

  const handlePublishFood = async () => {
    if (!foodFormData.foodName || !foodFormData.quantity || !foodFormData.location) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    let coordinates: Location | null = null
    if (foodFormData.location) {
      coordinates = await locationUtils.geocodeAddress(foodFormData.location)
    }

    const newPublication: FoodPublication = {
      id: Date.now().toString(),
      donorId: authState.user!.id,
      donorName: authState.user!.name,
      donorBusiness: authState.user!.businessName,
      foodName: foodFormData.foodName,
      quantity: Number.parseFloat(foodFormData.quantity),
      unit: foodFormData.unit,
      condition: foodFormData.condition,
      expirationDate: foodFormData.expirationDate || undefined,
      location: foodFormData.location,
      coordinates: coordinates || undefined,
      photo: foodFormData.photo || undefined,
      description: foodFormData.description || undefined,
      createdAt: new Date().toISOString(),
      status: "available",
    }

    storage.saveFoodPublication(newPublication)
    setFoodPublications((prev) => [...prev, newPublication])

    // Update user donation count
    if (authState.user) {
      const updatedUser = { ...authState.user, totalDonations: (authState.user.totalDonations || 0) + 1 }
      storage.saveUser(updatedUser)
      setAuthState((prev) => ({ ...prev, user: updatedUser }))
    }

    setCurrentView("my-publications")
    setFoodFormData({
      foodName: "",
      quantity: "",
      unit: "kg",
      condition: "nuevo",
      expirationDate: "",
      location: "",
      coordinates: null,
      photo: "",
      description: "",
    })
  }

  const getFilteredPublications = () => {
    let publications = foodPublications.filter((p) => p.status === "available")

    // Calculate distances if user location is available
    if (userLocation) {
      publications = publications.map((pub) => {
        if (pub.coordinates) {
          const distance = locationUtils.calculateDistance(userLocation, pub.coordinates)
          return { ...pub, distance }
        }
        return pub
      })
    }

    // Apply filters
    if (searchFilters.keyword) {
      publications = publications.filter(
        (p) =>
          p.foodName.toLowerCase().includes(searchFilters.keyword.toLowerCase()) ||
          p.donorName.toLowerCase().includes(searchFilters.keyword.toLowerCase()),
      )
    }

    if (searchFilters.condition) {
      publications = publications.filter((p) => p.condition === searchFilters.condition)
    }

    if (searchFilters.maxDistance && userLocation) {
      publications = publications.filter((p) => !p.distance || p.distance <= searchFilters.maxDistance)
    }

    // Sort publications
    switch (searchFilters.sortBy) {
      case "distance":
        publications.sort((a, b) => (a.distance || Number.POSITIVE_INFINITY) - (b.distance || Number.POSITIVE_INFINITY))
        break
      case "date":
      default:
        publications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return publications
  }

  const handleRequestPickup = () => {
    if (!pickupFormData.pickupDate || !pickupFormData.pickupTime) {
      alert("Por favor selecciona fecha y hora de recogida")
      return
    }

    const newRequest: PickupRequest = {
      id: Date.now().toString(),
      publicationId: selectedPublication!.id,
      beneficiaryId: authState.user!.id,
      beneficiaryName: authState.user!.name,
      beneficiaryPhone: authState.user!.phone,
      donorId: selectedPublication!.donorId,
      pickupDate: pickupFormData.pickupDate,
      pickupTime: pickupFormData.pickupTime,
      notes: pickupFormData.notes || undefined,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    }

    storage.savePickupRequest(newRequest)

    // Update publication status
    const updatedPublication = { ...selectedPublication!, status: "reserved" as const }
    storage.saveFoodPublication(updatedPublication)

    setShowPickupDialog(false)
    setSelectedPublication(null)
    setPickupFormData({ pickupDate: "", pickupTime: "", notes: "" })
    alert("Solicitud de recogida enviada exitosamente")
  }

  const updatePickupStatus = (requestId: string, newStatus: string) => {
    const requests = storage.getPickupRequests()
    const updatedRequests = requests.map((request) => {
      if (request.id === requestId) {
        return { ...request, status: newStatus }
      }
      return request
    })
    storage.savePickupRequests(updatedRequests)
    setPickupRequests(updatedRequests)

    // Si se marca como entregado, agregar al historial y permitir calificación
    if (newStatus === "entregado") {
      const request = requests.find((r) => r.id === requestId)
      if (request) {
        const publication = foodPublications.find((p) => p.id === request.publicationId)
        if (publication) {
          // Marcar publicación como completada
          const updatedPublications = foodPublications.map((pub) =>
            pub.id === publication.id ? { ...pub, status: "completado" } : pub,
          )
          storage.saveFoodPublications(updatedPublications)
          setFoodPublications(updatedPublications)
        }
      }
    }
  }

  const rateDonor = (donorId: string, stars: number, comment = "") => {
    const rating = {
      id: Date.now().toString(),
      donorId,
      beneficiaryId: authState.user?.id || "",
      stars,
      comment,
      createdAt: new Date().toISOString(),
    }

    const ratings = storage.getRatings()
    ratings.push(rating)
    storage.saveRatings(ratings)
  }

  const updateEvent = (event: Event) => {
    const events = storage.getEvents()
    const eventIndex = events.findIndex((e) => e.id === event.id)
    if (eventIndex >= 0) {
      events[eventIndex] = event
      storage.saveEvent(event)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventFormData.name || !eventFormData.location || !eventFormData.date || !eventFormData.time) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    let coordinates: Location | null = null
    if (eventFormData.location) {
      coordinates = await locationUtils.geocodeAddress(eventFormData.location)
    }

    const eventData: Event = {
      id: editingEvent?.id || Date.now().toString(),
      creatorId: authState.user!.id,
      creatorName: authState.user!.name,
      name: eventFormData.name,
      location: eventFormData.location,
      coordinates: coordinates || undefined,
      description: eventFormData.description,
      date: eventFormData.date,
      time: eventFormData.time,
      photo: eventFormData.photo || undefined,
      createdAt: editingEvent?.createdAt || new Date().toISOString(),
      attendees: editingEvent?.attendees || [],
    }

    storage.saveEvent(eventData)

    if (editingEvent) {
      setEvents((prev) => prev.map((e) => (e.id === eventData.id ? eventData : e)))
    } else {
      setEvents((prev) => [...prev, eventData])
    }

    setCurrentView("events")
    setEditingEvent(null)
    setEventFormData({
      name: "",
      location: "",
      coordinates: null,
      description: "",
      date: "",
      time: "",
      photo: "",
    })
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setEventFormData({
      name: event.name,
      location: event.location,
      coordinates: event.coordinates || null,
      description: event.description,
      date: event.date,
      time: event.time,
      photo: event.photo || "",
    })
    setCurrentView("create-event")
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este evento?")) {
      storage.deleteEvent(eventId)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      const users = storage.getUsers().filter((u) => u.id !== userId)
      localStorage.setItem("comida-usuarios", JSON.stringify(users))
    }
  }

  const handleDeletePublication = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      storage.deleteFoodPublication(id)
      setFoodPublications((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const updateUserRole = (userId: string, newRole: "donante" | "beneficiario" | "administrador") => {
    const users = storage.getUsers()
    const user = users.find((u) => u.id === userId)
    if (user) {
      user.userType = newRole
      storage.saveUser(user)
    }
  }

  const getStatistics = () => {
    const users = storage.getUsers()
    const publications = storage.getFoodPublications()
    const requests = storage.getPickupRequests()
    const events = storage.getEvents()

    return {
      totalUsers: users.length,
      totalDonors: users.filter((u) => u.userType === "donante").length,
      totalBeneficiaries: users.filter((u) => u.userType === "beneficiario").length,
      totalPublications: publications.length,
      activePublications: publications.filter((p) => p.status === "available").length,
      completedDonations: publications.filter((p) => p.status === "completed").length,
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === "pendiente").length,
      totalEvents: events.length,
    }
  }

  const getUserHistory = () => {
    const publications = storage.getFoodPublications()
    const requests = storage.getPickupRequests()

    if (authState.user?.userType === "donante") {
      return {
        donations: publications.filter((p) => p.donorId === authState.user?.id && p.status === "completed"),
        requests: requests.filter((r) => r.donorId === authState.user?.id && r.status === "entregado"),
      }
    } else {
      return {
        requests: requests.filter((r) => r.beneficiaryId === authState.user?.id && r.status === "entregado"),
      }
    }
  }

  // Render functions for different views
  const renderLogin = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Accede a tu cuenta de ComidaConCausa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Tu contraseña"
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleLogin} className="flex-1" style={{ backgroundColor: "#0E6115" }}>
            Iniciar Sesión
          </Button>
          <Button variant="outline" onClick={() => setCurrentView("home")} className="flex-1">
            Cancelar
          </Button>
        </div>
        <div className="text-center">
          <Button variant="link" onClick={() => setCurrentView("register")}>
            ¿No tienes cuenta? Regístrate
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderRegister = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>Únete a ComidaConCausa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Tu nombre completo"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Tu número de teléfono"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Tu contraseña"
          />
        </div>
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Tu dirección completa"
          />
        </div>
        <div>
          <Label htmlFor="userType">Tipo de Usuario *</Label>
          <Select value={formData.userType} onValueChange={(value) => handleSelectChange("userType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu tipo de usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="donante">Donante</SelectItem>
              <SelectItem value="beneficiario">Beneficiario</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.userType === "donante" && (
          <>
            <div>
              <Label htmlFor="businessName">Nombre del Negocio</Label>
              <Input
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Nombre de tu negocio (opcional)"
              />
            </div>
            <div>
              <Label htmlFor="rnc">RNC</Label>
              <Input
                id="rnc"
                name="rnc"
                value={formData.rnc}
                onChange={handleInputChange}
                placeholder="RNC de tu negocio (opcional)"
              />
            </div>
          </>
        )}
        <div className="flex space-x-2">
          <Button onClick={handleRegister} className="flex-1" style={{ backgroundColor: "#0E6115" }}>
            Crear Cuenta
          </Button>
          <Button variant="outline" onClick={() => setCurrentView("home")} className="flex-1">
            Cancelar
          </Button>
        </div>
        <div className="text-center">
          <Button variant="link" onClick={() => setCurrentView("login")}>
            ¿Ya tienes cuenta? Inicia sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderPublishFood = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Publicar Alimentos
        </CardTitle>
        <CardDescription>Comparte alimentos disponibles con la comunidad</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="foodName">Nombre del Alimento *</Label>
            <Input
              id="foodName"
              value={foodFormData.foodName}
              onChange={(e) => setFoodFormData((prev) => ({ ...prev, foodName: e.target.value }))}
              placeholder="Ej: Arroz, Pollo, Verduras"
            />
          </div>
          <div>
            <Label htmlFor="quantity">Cantidad *</Label>
            <div className="flex space-x-2">
              <Input
                id="quantity"
                type="number"
                value={foodFormData.quantity}
                onChange={(e) => setFoodFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
                className="flex-1"
              />
              <Select
                value={foodFormData.unit}
                onValueChange={(value) => setFoodFormData((prev) => ({ ...prev, unit: value }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="unidades">unidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="condition">Estado del Alimento</Label>
            <Select
              value={foodFormData.condition}
              onValueChange={(value) => setFoodFormData((prev) => ({ ...prev, condition: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo/Sellado</SelectItem>
                <SelectItem value="abierto">Abierto pero en buen estado</SelectItem>
                <SelectItem value="usado">Usado pero consumible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
            <Input
              id="expirationDate"
              type="date"
              value={foodFormData.expirationDate}
              onChange={(e) => setFoodFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Ubicación para Recogida *</Label>
          <div className="flex space-x-2">
            <Input
              id="location"
              value={foodFormData.location}
              onChange={(e) => setFoodFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Dirección completa donde se puede recoger"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (userLocation) {
                  setFoodFormData((prev) => ({
                    ...prev,
                    location: userLocation.address,
                    coordinates: userLocation,
                  }))
                }
              }}
              disabled={!userLocation}
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="photo">URL de Foto (opcional)</Label>
          <Input
            id="photo"
            value={foodFormData.photo}
            onChange={(e) => setFoodFormData((prev) => ({ ...prev, photo: e.target.value }))}
            placeholder="https://ejemplo.com/foto.jpg"
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción Adicional</Label>
          <Textarea
            id="description"
            value={foodFormData.description}
            onChange={(e) => setFoodFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Información adicional sobre el alimento..."
            rows={3}
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={handlePublishFood} className="flex-1" style={{ backgroundColor: "#0E6115" }}>
            Publicar Alimento
          </Button>
          <Button variant="outline" onClick={() => setCurrentView("home")} className="flex-1">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderBrowseFood = () => {
    const publications = getFilteredPublications()

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Alimentos Disponibles
            </CardTitle>
            {isLoadingLocation && <CardDescription>Obteniendo tu ubicación para mostrar distancias...</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="keyword">Buscar</Label>
                <Input
                  id="keyword"
                  value={searchFilters.keyword}
                  onChange={(e) => setSearchFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                  placeholder="Nombre del alimento o donante"
                />
              </div>
              <div>
                <Label htmlFor="maxDistance">Distancia máxima (km)</Label>
                <Select
                  value={searchFilters.maxDistance.toString()}
                  onValueChange={(value) =>
                    setSearchFilters((prev) => ({ ...prev, maxDistance: Number.parseInt(value) }))
                  }
                  disabled={!userLocation}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="20">20 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="999">Sin límite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="condition">Estado</Label>
                <Select
                  value={searchFilters.condition}
                  onChange={(e) => setSearchFilters((prev) => ({ ...prev, condition: e.target.value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="nuevo">Nuevo/Sellado</SelectItem>
                    <SelectItem value="abierto">Abierto</SelectItem>
                    <SelectItem value="usado">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sortBy">Ordenar por</Label>
                <Select
                  value={searchFilters.sortBy}
                  onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Fecha de publicación</SelectItem>
                    <SelectItem value="distance" disabled={!userLocation}>
                      Distancia
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publications.map((publication) => (
            <Card key={publication.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{publication.foodName}</CardTitle>
                    <CardDescription>
                      Por {publication.donorBusiness || publication.donorName}
                      {publication.distance && (
                        <span className="ml-2 text-green-600 font-medium">📍 {publication.distance.toFixed(1)} km</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {publication.condition}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {publication.photo && (
                  <img
                    src={publication.photo || "/placeholder.svg"}
                    alt={publication.foodName}
                    className="w-full h-32 object-cover rounded-md"
                  />
                )}
                <div className="space-y-2">
                  <p>
                    <strong>Cantidad:</strong> {publication.quantity} {publication.unit}
                  </p>
                  <p>
                    <strong>Ubicación:</strong> {publication.location}
                  </p>
                  {publication.expirationDate && (
                    <p>
                      <strong>Vence:</strong> {new Date(publication.expirationDate).toLocaleDateString()}
                    </p>
                  )}
                  {publication.description && <p className="text-sm text-gray-600">{publication.description}</p>}
                  <p className="text-xs text-gray-500">
                    Publicado: {new Date(publication.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  className="w-full"
                  style={{ backgroundColor: "#0E6115" }}
                  onClick={() => {
                    setSelectedPublication(publication)
                    setShowPickupDialog(true)
                  }}
                >
                  Solicitar Recogida
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {publications.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No hay alimentos disponibles</h3>
              <p className="text-gray-600">
                {searchFilters.keyword || searchFilters.condition || searchFilters.maxDistance < 999
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Aún no hay publicaciones de alimentos disponibles"}
              </p>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => setCurrentView("home")} className="w-full">
          Volver al Inicio
        </Button>
      </div>
    )
  }

  const renderHistory = () => {
    const history = getUserHistory()
    const stats = getStatistics()

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mi Historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {authState.user?.userType === "donante" && (
                <>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Award className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{history.donations?.length || 0}</div>
                    <div className="text-sm text-gray-600">Donaciones Completadas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Star className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {authState.user?.rating?.toFixed(1) || "5.0"}
                    </div>
                    <div className="text-sm text-gray-600">Calificación</div>
                  </div>
                </>
              )}
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{history.requests?.length || 0}</div>
                <div className="text-sm text-gray-600">Recogidas Completadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {authState.user?.userType === "donante" && history.donations && history.donations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Donaciones Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.donations.map((donation) => (
                  <div key={donation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{donation.foodName}</h4>
                        <p className="text-sm text-gray-600">
                          {donation.quantity} {donation.unit} • {donation.location}
                        </p>
                        <p className="text-xs text-gray-500">
                          Completado: {new Date(donation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Entregado
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {history.requests && history.requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Recogidas Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.requests.map((request) => {
                  const publication = storage.getFoodPublications().find((p) => p.id === request.publicationId)
                  return (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{publication?.foodName || "Alimento"}</h4>
                          <p className="text-sm text-gray-600">
                            Recogido el {new Date(request.pickupDate).toLocaleDateString()} a las {request.pickupTime}
                          </p>
                          <p className="text-xs text-gray-500">Donante: {publication?.donorName}</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Recibido
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={() => setCurrentView("home")} className="w-full">
          Volver al Inicio
        </Button>
      </div>
    )
  }

  const renderMyPublications = () => {
    const myPublications = foodPublications.filter((pub) => pub.donorId === authState.user?.id)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">Mis Publicaciones</h2>
          </div>
        </div>

        {myPublications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No tienes publicaciones</h3>
              <p className="text-gray-600 mb-4">Comienza publicando alimentos para ayudar a tu comunidad</p>
              <Button onClick={() => setCurrentView("publish-food")} style={{ backgroundColor: "#0E6115" }}>
                <Plus className="h-4 w-4 mr-2" />
                Publicar Alimentos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {myPublications.map((publication) => (
              <Card key={publication.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{publication.foodName}</h3>
                        <Badge variant={publication.status === "available" ? "default" : "secondary"}>
                          {publication.status === "available"
                            ? "Disponible"
                            : publication.status === "requested"
                              ? "Solicitado"
                              : "Completado"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {publication.quantity} {publication.unit} • Estado: {publication.condition}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {publication.location}
                      </p>
                      {publication.expirationDate && (
                        <p className="text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Expira: {new Date(publication.expirationDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Publicado: {new Date(publication.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePublication(publication.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderPickupRequests = () => {
    const myRequests = pickupRequests.filter((req) => req.donorId === authState.user?.id)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">Solicitudes de Recogida</h2>
          </div>
        </div>

        {myRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No tienes solicitudes de recogida</h3>
              <p className="text-gray-600">
                Las solicitudes aparecerán aquí cuando los beneficiarios soliciten tus alimentos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {myRequests.map((request) => {
              const publication = foodPublications.find((p) => p.id === request.publicationId)
              return (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{publication?.foodName}</h3>
                          <Badge
                            variant={
                              request.status === "pendiente"
                                ? "default"
                                : request.status === "en_camino"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {request.status === "pendiente"
                              ? "Pendiente"
                              : request.status === "en_camino"
                                ? "En Camino"
                                : "Entregado"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">Solicitado por: {request.beneficiaryName}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Fecha de recogida: {new Date(request.pickupDate).toLocaleDateString()} a las{" "}
                          {request.pickupTime}
                        </p>
                        <p className="text-xs text-gray-400">
                          Solicitado: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {request.status === "pendiente" && (
                          <Button
                            size="sm"
                            onClick={() => updatePickupStatus(request.id, "en-camino")}
                            style={{ backgroundColor: "#0E6115" }}
                          >
                            Marcar En Camino
                          </Button>
                        )}
                        {request.status === "en_camino" && (
                          <Button
                            size="sm"
                            onClick={() => updatePickupStatus(request.id, "entregado")}
                            style={{ backgroundColor: "#0E6115" }}
                          >
                            Marcar Entregado
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderMyRequests = () => {
    const myRequests = pickupRequests.filter((request) => request.beneficiaryId === authState.user?.id)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">Mis Solicitudes</h2>
          </div>
        </div>

        {myRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No tienes solicitudes</h3>
              <p className="text-gray-600 mb-4">Aún no has solicitado ningún alimento</p>
              <Button onClick={() => setCurrentView("browse-food")} style={{ backgroundColor: "#0E6115" }}>
                Buscar Alimentos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myRequests.map((request) => {
              const publication = foodPublications.find((p) => p.id === request.publicationId)
              return (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{publication?.foodName || "Alimento"}</h3>
                        <p className="text-gray-600">Donante: {publication?.donorName}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          request.status === "pendiente"
                            ? "text-yellow-600 border-yellow-600"
                            : request.status === "en_camino"
                              ? "text-blue-600 border-blue-600"
                              : "text-green-600 border-green-600"
                        }
                      >
                        {request.status === "pendiente"
                          ? "Pendiente"
                          : request.status === "en_camino"
                            ? "En Camino"
                            : "Entregado"}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Fecha de recogida: {new Date(request.pickupDate).toLocaleDateString()} a las{" "}
                        {request.pickupTime}
                      </p>
                      <p>
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Ubicación: {publication?.location}
                      </p>
                      <p className="text-xs text-gray-400">
                        Solicitado: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {request.status === "entregado" && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800 font-medium mb-2">¡Recogida completada!</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const stars = prompt("Califica al donante (1-5 estrellas):")
                            if (stars && Number.parseInt(stars) >= 1 && Number.parseInt(stars) <= 5) {
                              rateDonor(publication?.donorId || "", Number.parseInt(stars))
                              alert("¡Gracias por tu calificación!")
                            }
                          }}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Calificar Donante
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderEvents = () => {
    const filteredEvents = events.filter(
      (event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">Eventos Comunitarios</h2>
          </div>
          <Button onClick={() => setCurrentView("create-event")} style={{ backgroundColor: "#0E6115" }}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Evento
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-600 mb-4">Sé el primero en crear un evento comunitario</p>
              <Button onClick={() => setCurrentView("create-event")} style={{ backgroundColor: "#0E6115" }}>
                Crear Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{event.name}</h3>
                      <p className="text-gray-600">Organizado por: {event.organizerName}</p>
                    </div>
                    {event.organizerId === authState.user?.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEvent(event)
                            setCurrentView("create-event")
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("¿Estás seguro de que quieres eliminar este evento?")) {
                              const updatedEvents = events.filter((e) => e.id !== event.id)
                              storage.saveEvents(updatedEvents)
                              setEvents(updatedEvents)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{event.description}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(event.date).toLocaleDateString()} a las {event.time}
                    </p>
                    <p>
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {event.location}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCreateEvent = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (!eventData.name || !eventData.description || !eventData.date || !eventData.time || !eventData.location) {
        alert("Por favor completa todos los campos")
        return
      }

      const eventToSave = {
        id: editingEvent?.id || Date.now().toString(),
        ...eventData,
        organizerId: authState.user?.id || "",
        organizerName: authState.user?.name || "",
        createdAt: editingEvent?.createdAt || new Date().toISOString(),
      }

      let updatedEvents
      if (editingEvent) {
        updatedEvents = events.map((event) => (event.id === editingEvent.id ? eventToSave : event))
      } else {
        updatedEvents = [...events, eventToSave]
      }

      storage.saveEvents(updatedEvents)
      setEvents(updatedEvents)
      setEditingEvent(null)
      setCurrentView("events")
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditingEvent(null)
              setCurrentView("events")
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{editingEvent ? "Editar Evento" : "Crear Evento"}</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Evento</Label>
                <Input
                  id="name"
                  value={eventData.name}
                  onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                  placeholder="Ej: Jornada de Donación de Alimentos"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  placeholder="Describe el evento y sus objetivos..."
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventData.date}
                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  placeholder="Dirección del evento"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" style={{ backgroundColor: "#0E6115" }}>
                  {editingEvent ? "Actualizar Evento" : "Crear Evento"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingEvent(null)
                    setCurrentView("events")
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderHistoryView = () => {
    const history = getUserHistory()
    const stats = getStatistics()
    const averageRating = authState.user?.userType === "donante" ? calculateAverageRating(authState.user.id) : 0

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mi Historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {authState.user?.userType === "donante" && (
                <>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Award className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {
                        foodPublications.filter(
                          (pub) => pub.donorId === authState.user?.id && pub.status === "completado",
                        ).length
                      }
                    </div>
                    <div className="text-sm text-gray-600">Donaciones Completadas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Star className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">{averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Calificación Promedio</div>
                  </div>
                </>
              )}
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">
                  {authState.user?.userType === "donante"
                    ? foodPublications.filter((pub) => pub.donorId === authState.user?.id).length
                    : pickupRequests.filter((req) => req.beneficiaryId === authState.user?.id).length}
                </div>
                <div className="text-sm text-gray-600">
                  {authState.user?.userType === "donante" ? "Total Publicaciones" : "Total Solicitudes"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => setCurrentView("home")} className="w-full">
          Volver al Inicio
        </Button>
      </div>
    )
  }

  const renderHome = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authState.user && (
          <Card
            className="p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
            onClick={() => setCurrentView("history")}
          >
            <TrendingUp className="h-8 w-8 mx-auto mb-3" style={{ color: "#0E6115" }} />
            <h3 className="font-semibold">Mi Historial</h3>
            <p className="text-sm text-gray-600 mt-1">Revisa tus donaciones y recogidas</p>
          </Card>
        )}

        {authState.user && authState.user.userType === "donante" && (
          <Card
            className="p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
            onClick={() => setCurrentView("my-publications")}
          >
            <Package className="h-8 w-8 mx-auto mb-3" style={{ color: "#0E6115" }} />
            <h3 className="font-semibold">Mis Publicaciones</h3>
            <p className="text-sm text-gray-600 mt-1">Gestiona tus publicaciones de alimentos</p>
          </Card>
        )}

        {authState.user && authState.user.userType === "donante" && (
          <Card
            className="p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
            onClick={() => setCurrentView("pickup-requests")}
          >
            <Truck className="h-8 w-8 mx-auto mb-3" style={{ color: "#0E6115" }} />
            <h3 className="font-semibold">Solicitudes</h3>
            <p className="text-sm text-gray-600 mt-1">Gestiona las solicitudes de recogida</p>
          </Card>
        )}

        {authState.user && authState.user.userType === "beneficiario" && (
          <Card
            className="p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
            onClick={() => setCurrentView("my-requests")}
          >
            <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#0E6115" }} />
            <h3 className="font-semibold">Mis Solicitudes</h3>
            <p className="text-sm text-gray-600 mt-1">Ver el estado de tus solicitudes</p>
          </Card>
        )}

        {authState.user && (
          <Card
            className="p-6 text-center hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
            onClick={() => setCurrentView("events")}
          >
            <Calendar className="h-8 w-8 mx-auto mb-3" style={{ color: "#0E6115" }} />
            <h3 className="font-semibold">Eventos</h3>
            <p className="text-sm text-gray-600 mt-1">Participa en eventos comunitarios</p>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 animate-slide-in-left">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary animate-pulse-green">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ComidaConCausa</h1>
                <p className="text-xs text-muted-foreground">Reduciendo el desperdicio alimentario</p>
              </div>
            </div>

            <nav className="flex items-center space-x-4">
              {authState.isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Hola, {authState.user?.name} ({authState.user?.userType})
                  </span>
                  {authState.user?.userType === "donante" && (
                    <Button
                      onClick={() => setCurrentView("publish-food")}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 animate-scale-in"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Publicar
                    </Button>
                  )}
                  {authState.user?.userType === "beneficiario" && (
                    <Button
                      onClick={() => setCurrentView("browse-food")}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 animate-scale-in"
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Buscar
                    </Button>
                  )}
                  <Button onClick={handleLogout} variant="outline" size="sm" className="hover:bg-muted bg-transparent">
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentView("login")}
                    variant="outline"
                    size="sm"
                    className="hover:bg-muted"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    onClick={() => setCurrentView("register")}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!authState.isAuthenticated && currentView === "home" && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary animate-pulse-green shadow-lg">
                  <Heart className="h-14 w-14 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-5xl font-bold text-foreground mb-6 animate-fade-in-up">
                Bienvenido a <span className="text-primary">ComidaConCausa</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
                Conectamos donantes de alimentos con beneficiarios para reducir el desperdicio y ayudar a nuestra
                comunidad. Únete a nosotros en esta causa importante y marca la diferencia.
              </p>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
                <div className="bg-card p-8 rounded-xl shadow-lg card-hover bg-feature-gradient">
                  <Users className="h-16 w-16 mx-auto mb-6 text-primary" />
                  <h3 className="text-xl font-semibold mb-4 text-card-foreground">Comunidad Unida</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Conectamos personas que quieren ayudar con quienes necesitan apoyo alimentario
                  </p>
                </div>
                <div className="bg-card p-8 rounded-xl shadow-lg card-hover bg-feature-gradient">
                  <Package className="h-16 w-16 mx-auto mb-6 text-primary" />
                  <h3 className="text-xl font-semibold mb-4 text-card-foreground">Reduce Desperdicio</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Evitamos que alimentos en buen estado terminen en la basura
                  </p>
                </div>
                <div className="bg-card p-8 rounded-xl shadow-lg card-hover bg-feature-gradient">
                  <Shield className="h-16 w-16 mx-auto mb-6 text-primary" />
                  <h3 className="text-xl font-semibold mb-4 text-card-foreground">Seguro y Confiable</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Plataforma segura con verificación de usuarios y seguimiento
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                <Button
                  onClick={() => setCurrentView("register")}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Comenzar Ahora
                </Button>
                <Button
                  onClick={() => setCurrentView("login")}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  Iniciar Sesión
                </Button>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-card-foreground mb-8">Nuestro Impacto</h3>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{foodPublications.length}</div>
                    <div className="text-muted-foreground">Alimentos Publicados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {pickupRequests.filter((r) => r.status === "entregado").length}
                    </div>
                    <div className="text-muted-foreground">Donaciones Completadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{events.length}</div>
                    <div className="text-muted-foreground">Eventos Organizados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {authState.isAuthenticated ? (
          <div>
            {currentView === "home" && renderHome()}
            {currentView === "publish-food" && renderPublishFood()}
            {currentView === "browse-food" && renderBrowseFood()}
            {currentView === "my-publications" && renderMyPublications()}
            {currentView === "pickup-requests" && renderPickupRequests()}
            {currentView === "my-requests" && renderMyRequests()}
            {currentView === "events" && renderEvents()}
            {currentView === "create-event" && renderCreateEvent()}
            {currentView === "history" && renderHistoryView()}
          </div>
        ) : (
          <div>
            {currentView === "login" && renderLogin()}
            {currentView === "register" && renderRegister()}
          </div>
        )}
      </main>

      {showPickupDialog && selectedPublication && (
        <Dialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Recogida</DialogTitle>
              <DialogDescription>
                ¿Deseas solicitar la recogida de {selectedPublication.foodName} de {selectedPublication.donorName}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupDate">Fecha de Recogida</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    value={pickupFormData.pickupDate}
                    onChange={(e) => setPickupFormData((prev) => ({ ...prev, pickupDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pickupTime">Hora de Recogida</Label>
                  <Input
                    id="pickupTime"
                    type="time"
                    value={pickupFormData.pickupTime}
                    onChange={(e) => setPickupFormData((prev) => ({ ...prev, pickupTime: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={pickupFormData.notes}
                  onChange={(e) => setPickupFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Información adicional para el donante..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPickupDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRequestPickup} style={{ backgroundColor: "#0E6115" }}>
                Solicitar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
