// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DataGrid } from '@mui/x-data-grid';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { format } from 'date-fns';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  EventAvailable as LeaveIcon,
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  orderBy,
  Timestamp,
  updateDoc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { db, storage } from '../../firebase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useAuth } from '../../contexts/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import LeaveManagement from './LeaveManagement';

interface SignedDocument {
  id: string;
  agentId: string;
  agentName: string;
  documentData: string;
  month: string;
  year: string;
  uploadedAt: Date;
  fileName: string;
}

interface Payslip {
  id: string;
  agentId: string;
  agentName: string;
  documentUrl: string;
  month: string;
  year: string;
  uploadedAt: Date;
}

interface HolidayRecord {
  id: string;
  agentId: string;
  agentName: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface AgentHolidayBalance {
  id: string;
  agentId: string;
  agentName: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: string;
}

interface Contract {
  id: string;
  agentId: string;
  agentName: string;
  contractType: 'CDI' | 'CDD' | 'Internship' | 'Other';
  startDate: Date;
  endDate?: Date;
  salary: number;
  position: string;
  department: string;
  status: 'active' | 'terminated' | 'pending';
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ContractFormData {
  agentId: string;
  contractType: 'CDI' | 'CDD' | 'Internship' | 'Other';
  startDate: string;
  endDate?: string;
  salary: number;
  position: string;
  department: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hr-tabpanel-${index}`}
      aria-labelledby={`hr-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Define a generic document type for Firestore documents
type FirestoreDoc = {
  id: string;
  data: () => any;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const HRDashboard: React.FC = () => {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tabValue, setTabValue] = useState(0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [payslips, setPayslips] = useState<Payslip[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [holidayRecords, setHolidayRecords] = useState<HolidayRecord[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [holidayBalances, setHolidayBalances] = useState<AgentHolidayBalance[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAgent, setSelectedAgent] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedMonth, setSelectedMonth] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedYear, setSelectedYear] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDocument, setSelectedDocument] = useState<SignedDocument | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contracts, setContracts] = useState<Contract[]>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contractFormData, setContractFormData] = useState<ContractFormData>({
    agentId: '',
    contractType: 'CDI',
    startDate: '',
    endDate: '',
    salary: 0,
    position: '',
    department: '',
  });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchQuery, setSearchQuery] = useState('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedHolidayBalance, setSelectedHolidayBalance] = useState<AgentHolidayBalance | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [holidayBalanceDialogOpen, setHolidayBalanceDialogOpen] = useState(false);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      fetchSignedDocuments();
      fetchPayslips();
      fetchHolidayRecords();
      fetchHolidayBalances();
      fetchAgents();
      fetchContracts();
    }
  }, [user]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchSignedDocuments = async () => {
    try {
      setLoading(true);
      const signedDocsRef = collection(db, 'signedDocuments');
      const q = query(signedDocsRef, orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const documents: SignedDocument[] = [];
      querySnapshot.forEach((doc: FirestoreDoc) => {
        const data = doc.data();
        // Removed console.log
        
        documents.push({
          id: doc.id,
          agentId: data.agentId,
          agentName: data.agentName || 'Unknown',
          documentData: data.documentData,
          month: data.month,
          year: data.year,
          uploadedAt: data.uploadedAt.toDate(),
          fileName: data.fileName || 'document.pdf'
        });
      });
      
      setSignedDocuments(documents);
    } catch (error) {
      console.error('Error fetching signed documents:', error);
    } finally {
      setLoading(false);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchPayslips = async () => {
    try {
      const payslipsRef = collection(db, 'payslips');
      const q = query(payslipsRef, orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const slips: Payslip[] = [];
      querySnapshot.forEach((doc: FirestoreDoc) => {
        slips.push({ id: doc.id, ...doc.data() } as Payslip);
      });
      setPayslips(slips);
    } catch (error) {
      console.error('Error fetching payslips:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchHolidayRecords = async () => {
    try {
      const recordsRef = collection(db, 'holidayRecords');
      const q = query(recordsRef, orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const records: HolidayRecord[] = [];
      querySnapshot.forEach((doc: FirestoreDoc) => {
        records.push({ id: doc.id, ...doc.data() } as HolidayRecord);
      });
      setHolidayRecords(records);
    } catch (error) {
      console.error('Error fetching holiday records:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchHolidayBalances = async () => {
    try {
      const balancesRef = collection(db, 'holidayBalances');
      const q = query(balancesRef, orderBy('agentName', 'asc'));
      const querySnapshot = await getDocs(q);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      const balances: AgentHolidayBalance[] = [];
      querySnapshot.forEach((doc: FirestoreDoc) => {
        balances.push({ id: doc.id, ...doc.data() } as AgentHolidayBalance);
      });
      setHolidayBalances(balances);
    } catch (error) {
      console.error('Error fetching holiday balances:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchAgents = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const agentsList = snapshot.docs.map((doc: FirestoreDoc) => ({
        id: doc.id,
        name: doc.data().name || doc.data().displayName || 'Unknown Agent'
      }));
      setAgents(agentsList);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchContracts = async () => {
    try {
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const contractsList = snapshot.docs.map((doc: FirestoreDoc) => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate ? doc.data().endDate.toDate() : undefined,
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      }));
      setContracts(contractsList as Contract[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUploadPayslip = async () => {
    if (!selectedFile || !selectedAgent || !selectedMonth || !selectedYear) return;

    try {
      const storageRef = ref(storage, `payslips/${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'payslips'), {
        agentName: selectedAgent,
        documentUrl: downloadURL,
        month: selectedMonth,
        year: selectedYear,
        uploadedAt: new Date(),
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedAgent('');
      setSelectedMonth('');
      setSelectedYear('');
      fetchPayslips();
    } catch (error) {
      console.error('Error uploading payslip:', error);
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeletePayslip = async (payslip: Payslip) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'payslips', payslip.id));
      
      // Delete from Storage
      const storageRef = ref(storage, payslip.documentUrl);
      await deleteObject(storageRef);

      setDeleteDialogOpen(false);
      setSelectedPayslip(null);
      fetchPayslips();
    } catch (error) {
      console.error('Error deleting payslip:', error);
    }
  };

  // Function to handle document viewing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewDocument = (document: SignedDocument) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  // Function to handle document download
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDownloadDocument = (document: SignedDocument) => {
    try {
      // Convert base64 to blob
      const base64Response = document.documentData;
      const base64Data = base64Response.split(',')[1]; // Remove the data URL prefix
      const binaryData = atob(base64Data);
      const byteArray = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        byteArray[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.fileName || 'document.pdf');
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document. Please try again.');
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddContract = async () => {
    try {
      // Validate required fields
      if (!contractFormData.agentId || !contractFormData.startDate || !contractFormData.position || !contractFormData.department || !contractFormData.salary) {
        alert('Please fill in all required fields');
        return;
      }

      const selectedAgent = agents.find(agent => agent.id === contractFormData.agentId);
      if (!selectedAgent) {
        alert('Selected agent not found');
        return;
      }

      const contractData = {
        agentId: contractFormData.agentId,
        agentName: selectedAgent.name,
        contractType: contractFormData.contractType,
        startDate: Timestamp.fromDate(new Date(contractFormData.startDate)),
        endDate: contractFormData.endDate ? Timestamp.fromDate(new Date(contractFormData.endDate)) : null,
        salary: Number(contractFormData.salary),
        position: contractFormData.position,
        department: contractFormData.department,
        status: 'active',
        documents: [],
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };

      await addDoc(collection(db, 'contracts'), contractData);
      
      // Refresh contracts list
      await fetchContracts();
      
      // Reset form and close dialog
      setContractDialogOpen(false);
      setContractFormData({
        agentId: '',
        contractType: 'CDI',
        startDate: '',
        endDate: '',
        salary: 0,
        position: '',
        department: '',
      });
      
      alert('Contract added successfully!');
    } catch (error) {
      console.error('Error adding contract:', error);
      if (error instanceof Error) {
        alert(`Error adding contract: ${error.message}`);
      } else {
        alert('Error adding contract. Please try again.');
      }
    }
  };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateContractStatus = async (contractId: string, newStatus: 'active' | 'terminated' | 'pending') => {
    try {
      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        status: newStatus,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // Refresh contracts list
      await fetchContracts();
      
    } catch (error) {
      console.error('Error updating contract status:', error);
      alert('Error updating contract status. Please try again.');
    }
  };

  // Function to filter documents based on search query and filters
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getFilteredDocuments = () => {
    return signedDocuments.filter(doc => {
      const matchesSearch = 
        doc.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesMonth = !selectedMonthFilter || doc.month === selectedMonthFilter;
      const matchesYear = !selectedYearFilter || doc.year === selectedYearFilter;
      
      return matchesSearch && matchesMonth && matchesYear;
    });
  };

  // Get unique months and years for filters
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const availableMonths = Array.from(new Set(signedDocuments.map(doc => doc.month))).sort();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const availableYears = Array.from(new Set(signedDocuments.map(doc => doc.year))).sort().reverse();

  const handleEditHolidayBalance = (holidayBalance: AgentHolidayBalance) => {
    setSelectedHolidayBalance(holidayBalance);
    setHolidayBalanceDialogOpen(true);
  };

  const handleDeleteHolidayBalance = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this holiday balance record?')) {
      try {
        setLoading(true);
        const balanceRef = doc(db, 'holidayBalances', id);
        await deleteDoc(balanceRef);
        setHolidayBalances(holidayBalances.filter(balance => balance.id !== id));
        setLoading(false);
      } catch (error) {
        setError('Failed to delete holiday balance record');
        setLoading(false);
      }
    }
  };

  const handleSaveHolidayBalance = async () => {
    if (!selectedHolidayBalance) return;
    
    try {
      setLoading(true);
      const balanceRef = doc(db, 'holidayBalances', selectedHolidayBalance.id);
      await updateDoc(balanceRef, {
        totalDays: selectedHolidayBalance.totalDays,
        usedDays: selectedHolidayBalance.usedDays,
        remainingDays: selectedHolidayBalance.remainingDays,
        updatedAt: Timestamp.now()
      });
      
      setHolidayBalances(holidayBalances.map(balance => 
        balance.id === selectedHolidayBalance.id ? selectedHolidayBalance : balance
      ));
      
      setHolidayBalanceDialogOpen(false);
      setSelectedHolidayBalance(null);
      setLoading(false);
    } catch (error) {
      setError('Failed to update holiday balance record');
      setLoading(false);
    }
  };

  const handleEditContract = (contract: Contract) => {
    // Set contract form data for editing
    setContractFormData({
      agentId: contract.agentId,
      contractType: contract.contractType,
      startDate: format(contract.startDate, 'yyyy-MM-dd'),
      endDate: contract.endDate ? format(contract.endDate, 'yyyy-MM-dd') : undefined,
      salary: contract.salary,
      position: contract.position,
      department: contract.department,
    });
    setContractDialogOpen(true);
  };

  const handleDeleteContract = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      try {
        setLoading(true);
        const contractRef = doc(db, 'contracts', id);
        await deleteDoc(contractRef);
        setContracts(contracts.filter(contract => contract.id !== id));
        setLoading(false);
      } catch (error) {
        setError('Failed to delete contract');
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Documents signés" />
          <Tab label="Fiches de paie" />
          <Tab label="Contrats" />
          <Tab label="Gestion des congés" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Rechercher par nom ou fichier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Mois</InputLabel>
                  <Select
                    value={selectedMonthFilter}
                    onChange={(e) => setSelectedMonthFilter(e.target.value)}
                    label="Mois"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {availableMonths.map(month => (
                      <MenuItem key={month} value={month}>{month}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Année</InputLabel>
                  <Select
                    value={selectedYearFilter}
                    onChange={(e) => setSelectedYearFilter(e.target.value)}
                    label="Année"
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {availableYears.map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMonthFilter('');
                    setSelectedYearFilter('');
                  }}
                >
                  Réinitialiser
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {getFilteredDocuments().map((document) => (
                <Grid item xs={12} sm={6} md={4} key={document.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: 6,
                      },
                    }}
                  >
                    <Typography variant="h6" noWrap gutterBottom>
                      {document.fileName}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {document.agentName}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={`${document.month} ${document.year}`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={format(document.uploadedAt, 'dd/MM/yyyy')}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewDocument(document)}
                          variant="outlined"
                          size="small"
                        >
                          Voir
                        </Button>
                        <Button
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(document)}
                          variant="contained"
                          size="small"
                        >
                          Télécharger
                        </Button>
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Ajouter une fiche de paie
            </Button>
          </Box>

          <DataGrid
            rows={payslips}
            columns={[
              { field: 'agentName', headerName: 'Agent', width: 200 },
              { field: 'month', headerName: 'Mois', width: 100 },
              { field: 'year', headerName: 'Année', width: 100 },
              {
                field: 'uploadedAt',
                headerName: 'Date',
                width: 150,
                valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
              },
              {
                field: 'actions',
                headerName: 'Actions',
                width: 200,
                renderCell: (params) => (
                  <Stack direction="row" spacing={1}>
                    <Button
                      href={params.row.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir
                    </Button>
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        setSelectedPayslip(params.row);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Supprimer
                    </Button>
                  </Stack>
                ),
              },
            ]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 5 },
              },
            }}
            disableRowSelectionOnClick
            autoHeight
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Gestion des contrats</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setContractDialogOpen(true)}
              >
                Nouveau contrat
              </Button>
            </Stack>
          </Box>

          <DataGrid
            rows={contracts}
            columns={[
              { field: 'agentName', headerName: 'Agent', width: 200 },
              { field: 'contractType', headerName: 'Type', width: 120 },
              { field: 'position', headerName: 'Position', width: 150 },
              { field: 'department', headerName: 'Department', width: 150 },
              {
                field: 'startDate',
                headerName: 'Date de début',
                width: 120,
                valueFormatter: (params) => format(params.value, 'dd/MM/yyyy'),
              },
              {
                field: 'endDate',
                headerName: 'Date de fin',
                width: 120,
                valueFormatter: (params) => params.value ? format(params.value, 'dd/MM/yyyy') : '-',
              },
              {
                field: 'status',
                headerName: 'Statut',
                width: 150,
                renderCell: (params) => (
                  <FormControl fullWidth size="small">
                    <Select
                      value={params.value}
                      onChange={(e) => handleUpdateContractStatus(params.row.id, e.target.value as 'active' | 'terminated' | 'pending')}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="active">Actif</MenuItem>
                      <MenuItem value="terminated">Terminé</MenuItem>
                      <MenuItem value="pending">En attente</MenuItem>
                    </Select>
                  </FormControl>
                ),
              },
              {
                field: 'actions',
                headerName: 'Actions',
                width: 120,
                renderCell: (params) => (
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditContract(params.row)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteContract(params.row.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ),
              },
            ]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            disableRowSelectionOnClick
            autoHeight
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <LeaveManagement />
        </TabPanel>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Ajouter une fiche de paie</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Nom de l'agent"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              fullWidth
            />
            <TextField
              label="Mois"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              fullWidth
            />
            <TextField
              label="Année"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              fullWidth
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Sélectionner un fichier
              <input
                type="file"
                hidden
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" color="textSecondary">
                Fichier sélectionné: {selectedFile.name}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleUploadPayslip} variant="contained">
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la fiche de paie de {selectedPayslip?.agentName} pour {selectedPayslip?.month}/{selectedPayslip?.year} ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={() => selectedPayslip && handleDeletePayslip(selectedPayslip)}
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Document View - {selectedDocument?.fileName}
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ width: '100%', height: '80vh' }}>
              <iframe
                src={selectedDocument.documentData}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="PDF Viewer"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedDocument && (
            <Button
              onClick={() => handleDownloadDocument(selectedDocument)}
              startIcon={<DownloadIcon />}
              variant="contained"
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Contract Dialog */}
      <Dialog 
        open={contractDialogOpen} 
        onClose={() => setContractDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ajouter un nouveau contrat</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={contractFormData.agentId}
                  label="Agent *"
                  onChange={(e) => setContractFormData({
                    ...contractFormData,
                    agentId: e.target.value
                  })}
                  error={!contractFormData.agentId}
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type de contrat *</InputLabel>
                <Select
                  value={contractFormData.contractType}
                  label="Type de contrat *"
                  onChange={(e) => setContractFormData({
                    ...contractFormData,
                    contractType: e.target.value as any
                  })}
                  error={!contractFormData.contractType}
                >
                  <MenuItem value="CDI">CDI</MenuItem>
                  <MenuItem value="CDD">CDD</MenuItem>
                  <MenuItem value="Internship">Stage</MenuItem>
                  <MenuItem value="Other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Poste *"
                value={contractFormData.position}
                onChange={(e) => setContractFormData({
                  ...contractFormData,
                  position: e.target.value
                })}
                error={!contractFormData.position}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Date de début *"
                type="date"
                value={contractFormData.startDate}
                onChange={(e) => setContractFormData({
                  ...contractFormData,
                  startDate: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
                error={!contractFormData.startDate}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de fin"
                type="date"
                value={contractFormData.endDate}
                onChange={(e) => setContractFormData({
                  ...contractFormData,
                  endDate: e.target.value
                })}
                InputLabelProps={{ shrink: true }}
                helperText="Optionnel pour CDI"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Département *"
                value={contractFormData.department}
                onChange={(e) => setContractFormData({
                  ...contractFormData,
                  department: e.target.value
                })}
                error={!contractFormData.department}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Salaire *"
                type="number"
                value={contractFormData.salary}
                onChange={(e) => setContractFormData({
                  ...contractFormData,
                  salary: Number(e.target.value)
                })}
                error={!contractFormData.salary}
                InputProps={{
                  endAdornment: <Typography>€</Typography>
                }}
              />
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            * Champs obligatoires
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={handleAddContract} 
            variant="contained" 
            color="primary"
            disabled={!contractFormData.agentId || !contractFormData.startDate || !contractFormData.position || !contractFormData.department || !contractFormData.salary}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Holiday Balance Edit Dialog */}
      <Dialog open={holidayBalanceDialogOpen} onClose={() => setHolidayBalanceDialogOpen(false)}>
        <DialogTitle>Edit Holiday Balance</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Total Days"
                  type="number"
                  fullWidth
                  value={selectedHolidayBalance?.totalDays || 0}
                  onChange={(e) => setSelectedHolidayBalance(prev => 
                    prev ? {...prev, totalDays: Number(e.target.value)} : null
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Used Days"
                  type="number"
                  fullWidth
                  value={selectedHolidayBalance?.usedDays || 0}
                  onChange={(e) => {
                    const usedDays = Number(e.target.value);
                    setSelectedHolidayBalance(prev => {
                      if (!prev) return null;
                      const remainingDays = prev.totalDays - usedDays;
                      return {...prev, usedDays, remainingDays};
                    });
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Remaining Days"
                  type="number"
                  fullWidth
                  disabled
                  value={selectedHolidayBalance?.remainingDays || 0}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHolidayBalanceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveHolidayBalance} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HRDashboard;