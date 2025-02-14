pip install MACS3

// inside the ata-sec folder -c is the cutoff value
macs3 bdgpeakcall -i ata_sec_bed_file.bed -o genereated_peaks_files.bed -c 1.0

macs3 bdgpeakcall -i 12hr_mock_infected_ATAC_sec.bed -o 12hr_mock_infected_ATAC_sec_peaks.bed -c 1.0

macs3 bdgpeakcall -i 12hr_mva_infected_ATAC_sec.bed -o 12hr_mva_infected_ATAC_sec_peaks.bed -c 1.0

macs3 bdgpeakcall -i 18hr_mva_infected_ATAC_sec.bed -o 18hr_mva_infected_ATAC_sec_peaks.bed -c 1.0

macs3 bdgpeakcall -i 18hr_mock_infected_ATAC_sec.bed -o 18hr_mock_infected_ATAC_sec_peaks.bed -c 1.0

macs3 bdgpeakcall -i 24hr_mock_infected_ATAC_sec.bed -o 24hr_mock_infected_ATAC_sec_peaks.bed -c 1.0

macs3 bdgpeakcall -i 24hr_mva_infected_ATAC_sec.bed -o 24hr_mva_infected_ATAC_sec_peaks.bed -c 1.0
