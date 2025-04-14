const { NlpManager } = require('node-nlp');
const openFdaService = require('./openFdaService'); // Import the OpenFDA service

// Initialize NLP Manager
const manager = new NlpManager({ languages: ['en'], forceNER: true });

console.log('[NLP Service] Initializing NLP Manager. Removing all regex rules...');

// Add entities for recognition (using only named entities now)
manager.addNamedEntityText('medication', 'aspirin', ['en'], ['Aspirin', 'ASA']);
manager.addNamedEntityText('medication', 'lipitor', ['en'], ['Lipitor', 'atorvastatin']);
manager.addNamedEntityText('medication', 'metformin', ['en'], ['Metformin', 'Glucophage']);
manager.addNamedEntityText('medication', 'crocin', ['en'], ['Crocin', 'Paracetamol']);
// Add more common medications here...

manager.addNamedEntityText('dosageUnit', 'pill', ['en'], ['pill', 'pills', 'tablet', 'tablets', 'capsule', 'capsules']);
manager.addNamedEntityText('dosageUnit', 'mg', ['en'], ['mg', 'milligram', 'milligrams']);
manager.addNamedEntityText('dosageUnit', 'ml', ['en'], ['ml', 'milliliter', 'milliliters']);

manager.addNamedEntityText('timeOfDay', 'morning', ['en'], ['morning', 'AM', 'a.m.', 'in the morning']);
manager.addNamedEntityText('timeOfDay', 'noon', ['en'], ['noon', 'midday']);
manager.addNamedEntityText('timeOfDay', 'afternoon', ['en'], ['afternoon']);
manager.addNamedEntityText('timeOfDay', 'evening', ['en'], ['evening', 'PM', 'p.m.', 'in the evening']);
manager.addNamedEntityText('timeOfDay', 'night', ['en'], ['night', 'bedtime', 'at night']);

manager.addNamedEntityText('mealTime', 'breakfast', ['en'], ['breakfast', 'before breakfast', 'after breakfast']);
manager.addNamedEntityText('mealTime', 'lunch', ['en'], ['lunch', 'before lunch', 'after lunch']);
manager.addNamedEntityText('mealTime', 'dinner', ['en'], ['dinner', 'before dinner', 'after dinner']);

manager.addNamedEntityText('frequencyTerm', 'daily', ['en'], ['daily', 'every day', 'once a day']);
manager.addNamedEntityText('frequencyTerm', 'twice', ['en'], ['twice a day', 'two times a day']);
manager.addNamedEntityText('frequencyTerm', 'thrice', ['en'], ['thrice a day', 'three times a day']);

manager.addNamedEntityText('instructionTerm', 'with_water', ['en'], ['with water', 'glass of water']);
manager.addNamedEntityText('instructionTerm', 'with_food', ['en'], ['with food', 'with meals']);
manager.addNamedEntityText('instructionTerm', 'empty_stomach', ['en'], ['empty stomach', 'before food', 'before meals']);

console.log('[NLP Service] Manager initialized ONLY with named entities.');

/**
 * Simplified text parsing focusing on named entities and basic patterns.
 */
exports.parsePrescriptionText = async (text) => {
    try {
        console.log('[NLP Service] Parsing text:', text);
        // Ensure manager is trained if necessary (usually needed after adding entities/rules)
        // await manager.train(); // Consider if needed, might be slow
        const result = await manager.process('en', text);
        
        const entities = result.entities || [];
        console.log('[NLP Service] Entities found:', JSON.stringify(entities));
        
        const structuredMedications = [];
        let medication = { name: null, dosage: null, frequency: null, instructions: null, reminderTimes: [], timeContext: null };

        // Extract entities (based on named entities)
        const medicationEntity = entities.find(e => e.entity === 'medication');
        // Note: dosageNumber entity was removed as it relied on addRule
        const dosageUnitEntity = entities.find(e => e.entity === 'dosageUnit');
        const frequencyTermEntity = entities.find(e => e.entity === 'frequencyTerm');
        const timeOfDayEntities = entities.filter(e => e.entity === 'timeOfDay');
        const mealTimeEntities = entities.filter(e => e.entity === 'mealTime');
        const instructionTermEntity = entities.find(e => e.entity === 'instructionTerm');

        // Find medication name
        if (medicationEntity) {
            medication.name = medicationEntity.utteranceText || medicationEntity.option;
        } else {
            // Basic fallback regex if no entity found
            const nameMatch = text.match(/take\s+([A-Za-z0-9\s\-]+?)(?:\s+pill|\s+tablet|\s+mg)/i);
            if (nameMatch && nameMatch[1]) {
                 medication.name = nameMatch[1].trim();
            }
            if (!medication.name) {
                 console.log('[NLP Service] No medication name identified.');
                 return { rawEntities: entities, structuredMedications: [] };
            }
        }

        // Construct Dosage using regex for number + found unit entity
        const dosageNumMatch = text.match(/\b(\d+(?:\.\d+)?)\b/); // Find number separately
        if (dosageNumMatch && dosageNumMatch[1]) {
             if (dosageUnitEntity) {
                 medication.dosage = `${dosageNumMatch[1]} ${dosageUnitEntity.sourceText || dosageUnitEntity.option}`;
             } else {
                 medication.dosage = dosageNumMatch[1]; // Just the number if no unit found
             }
        } 
        // Fallback dosage regex if number/unit combo fails
        if (!medication.dosage) {
            const dosageMatch = text.match(/(\d+(?:\.\d+)?(?:\s*(?:pill|tablet|mg|ml))?)/i);
            if (dosageMatch && dosageMatch[1]) {
                medication.dosage = dosageMatch[1].trim();
            }
        }
        
        // Frequency (using named entity or fallback regex)
        if (frequencyTermEntity) {
            medication.frequency = frequencyTermEntity.sourceText || frequencyTermEntity.option;
        } 
        if (!medication.frequency) {
             const freqMatch = text.match(/(daily|once a day|twice a day|\d+ time[s]? a day|every \d+ hour[s]?)/i);
             if (freqMatch && freqMatch[0]) {
                 medication.frequency = freqMatch[0];
             }
        }

        // Instructions (using named entity or fallback regex)
        if (instructionTermEntity) {
            switch(instructionTermEntity.option) {
                case 'with_water': medication.instructions = 'Take with water'; break;
                case 'with_food': medication.instructions = 'Take with food'; break;
                case 'empty_stomach': medication.instructions = 'Take on empty stomach'; break;
            }
        } else {
            const instrMatch = text.match(/(with water|with food|empty stomach)/i);
            if (instrMatch && instrMatch[0]) {
                medication.instructions = instrMatch[0];
            }
        }

        // Reminder Times (Combine timeOfDay and mealTime named entities)
        const timeContextParts = [];
        const timeMap = {
            morning: '8:00 AM', breakfast: '7:30 AM',
            noon: '12:00 PM', lunch: '12:30 PM',
            afternoon: '3:00 PM',
            evening: '6:00 PM', dinner: '6:30 PM',
            night: '10:00 PM'
        };
        
        timeOfDayEntities.forEach(e => {
            const timeKey = e.option;
            if (timeMap[timeKey] && !medication.reminderTimes.includes(timeMap[timeKey])) {
                medication.reminderTimes.push(timeMap[timeKey]);
                timeContextParts.push(e.sourceText || e.option);
            }
        });
         mealTimeEntities.forEach(e => {
             const timeKey = e.option;
             if (timeMap[timeKey] && !medication.reminderTimes.includes(timeMap[timeKey])) {
                 medication.reminderTimes.push(timeMap[timeKey]);
                 timeContextParts.push(e.sourceText || e.option);
             }
         });
         
        // Fallback regex for HH:MM am/pm if no entities found times
        if (medication.reminderTimes.length === 0) {
            const timeMatches = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/gi);
            if (timeMatches) {
                timeMatches.forEach(t => {
                    medication.reminderTimes.push(t.toUpperCase()); // Add directly
                    timeContextParts.push(t);
                });
            }
        }
         
        medication.timeContext = timeContextParts.join(', ');
        medication.reminderTimes.sort(); // Sort times for consistency

        // Infer frequency if not explicitly found but times exist
        if (!medication.frequency && medication.reminderTimes.length > 0) {
            if (medication.reminderTimes.length === 1) medication.frequency = 'once a day';
            else if (medication.reminderTimes.length === 2) medication.frequency = 'twice a day';
            else medication.frequency = `${medication.reminderTimes.length} times a day`;
        }

        // --- FDA Validation --- 
        try {
            // Ensure we have a name before validating
            if(medication.name) {
                const validationResult = await openFdaService.findDrugByName(medication.name);
                medication.validation = validationResult;
            } else {
                medication.validation = { found: false, nameUsed: null, error: "No medication name found for validation." };
            }
        } catch (error) {
            console.error('[NLP Service] Error validating medication with FDA:', error);
            medication.validation = { found: false, nameUsed: medication.name, error: error.message };
        }
        // -------------------- 

        // Only add if a medication name was found
        if (medication.name) {
             structuredMedications.push(medication);
             console.log('[NLP Service] Parsed Medication:', JSON.stringify(medication));
        } else {
             console.log('[NLP Service] Final parsed object missing medication name, not adding.');
        }

        return {
            rawEntities: entities,
            structuredMedications: structuredMedications
        };
    } catch (error) {
        console.error('[NLP Service] Error parsing prescription text:', error);
        // Return error structure for the controller to handle
        return {
            error: `NLP Processing Error: ${error.message}`,
            rawEntities: [],
            structuredMedications: []
        };
    }
};
