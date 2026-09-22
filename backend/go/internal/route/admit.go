package route

import "context"

type Admission struct {
	RecordID string
	Record   []byte
	Read     func(ctx context.Context, id string) ([]byte, error)
	Evaluate func(ctx context.Context, record []byte) ([]byte, error)
}

func (result *Result) RunAdmission(ctx context.Context, call Admission) error {
	if result.Specialist.ID != "admission" || result.Blocked {
		return nil
	}
	record := call.Record
	if call.RecordID != "" {
		if call.Read == nil {
			result.Blocked = true
			result.Reason = "registry.read is not connected."
			return nil
		}
		read, err := call.Read(ctx, call.RecordID)
		if err != nil {
			return err
		}
		record = read
	}
	if len(record) == 0 {
		result.Blocked = true
		result.Reason = "No admission record was supplied."
		return nil
	}
	if call.Evaluate == nil {
		result.Blocked = true
		result.Reason = "policy.evaluate is not connected."
		return nil
	}
	decision, err := call.Evaluate(ctx, record)
	if err != nil {
		return err
	}
	result.ToolResult = decision
	return nil
}
